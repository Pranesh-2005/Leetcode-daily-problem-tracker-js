import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import cors from 'cors';
import ws from 'ws';
import { Worker } from 'bullmq';
import fs from 'fs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ================= CONFIG =================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  { realtime: { transport: ws } }
);

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

const emailQueue = new Queue('emails', {
  connection: redis,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
  },
});

const LEETCODE_API = 'https://leetcode-api-vercel.vercel.app';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ================= GMAIL SETUP =================

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BACKEND_URL}/auth/google/callback`
);

// Load credentials from environment or file
let credentials;

if (process.env.GMAIL_CREDENTIALS) {
  // Production: Load from environment variable
  try {
    credentials = JSON.parse(process.env.GMAIL_CREDENTIALS);
    oauth2Client.setCredentials(credentials);
    console.log('✅ Gmail credentials loaded from environment');
  } catch (err) {
    console.error('❌ Invalid GMAIL_CREDENTIALS JSON:', err.message);
  }
} else {
  // Development: Load from file
  try {
    const tokenData = fs.readFileSync('gmail-token.json', 'utf8');
    credentials = JSON.parse(tokenData);
    oauth2Client.setCredentials(credentials);
    console.log('✅ Gmail token loaded from gmail-token.json');
  } catch (err) {
    console.warn('⚠️ No GMAIL_CREDENTIALS env var or gmail-token.json found');
    console.warn('   For development: Run "node setup-gmail.js"');
    console.warn('   For production: Add GMAIL_CREDENTIALS to .env or hosting provider');
  }
}

// Auto-refresh and save tokens (development only)
oauth2Client.on('tokens', (tokens) => {
  if (tokens.refresh_token && !process.env.GMAIL_CREDENTIALS) {
    fs.writeFileSync('gmail-token.json', JSON.stringify(tokens, null, 2));
    console.log('📝 Token refreshed and saved to gmail-token.json');
  }
});

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// ================= VALIDATION =================

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const validEmail = (email) => EMAIL_REGEX.test(email);

const validLeetCode = async (username) => {
  if (!username || username.length < 3) return false;
  try {
    const res = await axios.get(`${LEETCODE_API}/${username}`, {
      timeout: 8000,
    });
    return res.status === 200;
  } catch {
    return false;
  }
};

// ================= LEETCODE =================

const getDailyProblem = async () => {
  const res = await axios.get(`${LEETCODE_API}/daily`, { timeout: 10000 });
  const data = res.data;
  const title = data.questionTitle || data.title;
  return { title, slug: data.titleSlug };
};

const solvedToday = async (username, slug) => {
  try {
    const res = await axios.get(
      `${LEETCODE_API}/${username}/acSubmission?limit=20`,
      { timeout: 10000 }
    );

    if (res.status !== 200) return false;

    let submissions;
    if (res.data.submission) submissions = res.data.submission;
    else if (res.data.data) submissions = res.data.data;
    else if (Array.isArray(res.data)) submissions = res.data;
    else return false;

    const today = new Date().toDateString();

    for (const s of submissions) {
      if (!s || s.titleSlug !== slug) continue;
      const solvedDate = new Date(s.timestamp * 1000).toDateString();
      if (solvedDate === today) return true;
    }
    return false;
  } catch (e) {
    console.warn('⚠️ solvedToday error:', e.message);
    return false;
  }
};

// ================= EMAIL QUEUE PROCESSOR =================

const emailWorker = new Worker('emails', async (job) => {
  const { to, subject, html } = job.data;
  const maxRetries = job.attemptsMade;

  try {
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      html,
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    console.log(`✅ Email sent to ${to}`);
    return { success: true, to, subject };
  } catch (err) {
    if (err.status === 429) {
      console.warn(`⏳ Rate limited (attempt ${maxRetries}): ${to}`);
      throw err; // Retry with backoff
    }
    throw err;
  }
}, { connection: redis });

emailWorker.on('failed', (job, err) => {
  console.error(`❌ Email failed after retries: ${job.data.to} - ${err.message}`);
});

// ================= API ROUTES =================

app.post('/api/subscribe', async (req, res) => {
  const { username, email, timezone } = req.body;

  if (!validEmail(email)) return res.status(400).json({ error: 'Invalid email' });
  if (!(await validLeetCode(username)))
    return res.status(400).json({ error: 'Invalid LeetCode username' });

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('email_verified, verification_token, unsubscribed')
      .eq('email', email)
      .single();

    if (existing) {
      if (existing.email_verified && !existing.unsubscribed) {
        return res.status(200).json({ message: 'Already subscribed' });
      }

      if (existing.email_verified && existing.unsubscribed) {
        await supabase
          .from('users')
          .update({
            unsubscribed: false,
            leetcode_username: username,
            timezone,
            last_sent_date: null,
            last_sent_slot: null,
          })
          .eq('email', email);

        return res.status(200).json({ message: 'Re-subscribed successfully!' });
      }

      const link = `${FRONTEND_URL}/verify?token=${existing.verification_token}`;
      await emailQueue.add('send', {
        to: email,
        subject: 'Verify your subscription',
        html: `<a href="${link}">Verify</a>`,
      });

      return res.status(200).json({ message: 'Verification re-sent' });
    }

    const token = crypto.randomUUID();
    await supabase.from('users').insert({
      leetcode_username: username,
      email,
      timezone,
      email_verified: false,
      verification_token: token,
      unsubscribed: false,
    });

    const link = `${FRONTEND_URL}/verify?token=${token}`;
    await emailQueue.add('send', {
      to: email,
      subject: 'Verify your subscription',
      html: `<a href="${link}">Verify</a>`,
    });

    res.status(201).json({ message: 'Verification sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Subscription failed' });
  }
});

app.post('/api/verify', async (req, res) => {
  const { token } = req.body;

  try {
    const { data } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('verification_token', token)
      .eq('email_verified', false)
      .select();

    if (!data || data.length === 0) {
      return res.status(400).json({ error: 'Invalid or already verified link' });
    }
    
    res.status(200).json({ message: 'Email verified' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

app.post('/api/unsubscribe', async (req, res) => {
  const { token } = req.body;

  try {
    const { data } = await supabase
      .from('users')
      .update({ unsubscribed: true })
      .eq('verification_token', token)
      .select();

    if (!data?.length) return res.status(400).json({ error: 'Invalid link' });
    res.status(200).json({ message: 'Unsubscribed' });
  } catch (err) {
    res.status(500).json({ error: 'Unsubscribe failed' });
  }
});

app.post('/api/scheduler', async (req, res) => {
  const { secret } = req.body;

  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: users } = await supabase
      .from('users')
      .select('id, leetcode_username, email, timezone, last_sent_date, last_sent_slot, verification_token')
      .eq('email_verified', true)
      .eq('unsubscribed', false);

    const { title, slug } = await getDailyProblem();
    const now = new Date();
    let sent = 0;

    for (const user of users) {
      const tz = Intl.DateTimeFormat(undefined, {
        timeZone: user.timezone,
      }).format(now);
      const hour = new Date(
        new Date().toLocaleString('en-US', { timeZone: user.timezone })
      ).getHours();

      let slot, subject, body;
      if (hour >= 8 && hour <= 9) {
        slot = 'morning';
        subject = "Today's LeetCode";
        body = `<b>${title}</b>`;
      } else if (hour >= 14 && hour <= 15) {
        slot = 'afternoon';
        subject = 'Reminder';
        body = `Solve <b>${title}</b>`;
      } else if (hour >= 19 && hour <= 20) {
        slot = 'night';
        subject = 'Final Reminder';
        body = `Last chance: <b>${title}</b>`;
      } else {
        continue;
      }

      const today = new Date().toISOString().split('T')[0];
      if (user.last_sent_date === today && user.last_sent_slot === slot) {
        continue;
      }

      if (await solvedToday(user.leetcode_username, slug)) {
        continue;
      }

      const unsub = `${FRONTEND_URL}/unsubscribe?token=${user.verification_token}`;
      const html = `${body}<br><a href="${unsub}">Unsubscribe</a>`;

      await emailQueue.add('send', {
        to: user.email,
        subject,
        html,
      });

      await supabase
        .from('users')
        .update({
          last_sent_date: today,
          last_sent_slot: slot,
        })
        .eq('id', user.id);

      sent++;
    }

    res.status(200).json({ message: `Scheduler completed. Sent: ${sent}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scheduler failed' });
  }
});

app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.send'],
  });
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Store tokens in secure storage (implement based on your needs)
    res.redirect(`${FRONTEND_URL}?auth=success`);
  } catch (err) {
    res.redirect(`${FRONTEND_URL}?auth=failed`);
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});