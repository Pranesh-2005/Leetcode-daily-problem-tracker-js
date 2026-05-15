import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, useSearchParams, useNavigate, Routes, Route } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://eetcode-daily-problem-tracker-js-pranesh-20059066-bds8vqa7.leapcell.dev';

function SubscribePage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageType, setMessageType] = useState('');
  const [focused, setFocused] = useState('');

  const timezones = Intl.supportedValuesOf('timeZone');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const res = await fetch(`${API_URL}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessageType('success');
        setMessage(data.message || '✅ Verification email sent!');
        setFormData({ username: '', email: '', timezone: formData.timezone });
      } else {
        setMessageType('error');
        setMessage(data.error || '❌ Something went wrong');
      }
    } catch (err) {
      setMessageType('error');
      setMessage('❌ Failed to connect to server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <style>{keyframes}</style>
      <div style={styles.backgroundBlobs} />
      <div style={styles.floatingElements}>
        <div style={{...styles.floatingElement, left: '10%', top: '20%', animation: 'float 6s ease-in-out infinite'}} />
        <div style={{...styles.floatingElement, right: '10%', bottom: '20%', animation: 'float 8s ease-in-out infinite 1s'}} />
      </div>

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.headerSection}>
          <div style={styles.badge}>
            <span style={{marginRight: '6px'}}>✨</span>
            NEW FEATURE
          </div>
          <h1 style={styles.mainTitle}>LeetCode Daily Notifier</h1>
          <p style={styles.subtitle}>
            Never miss your daily coding challenge. Get smart reminders delivered to your inbox at the perfect times.
          </p>
        </div>

        {/* Card */}
        <div style={styles.glassCard}>
          <form onSubmit={handleSubscribe} style={styles.form}>
            {/* Username */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <span style={styles.labelIcon}>👤</span> LeetCode Username
              </label>
              <input
                name="username"
                placeholder="e.g., gvanrossum"
                value={formData.username}
                onChange={handleChange}
                onFocus={() => setFocused('username')}
                onBlur={() => setFocused('')}
                required
                style={{
                  ...styles.input,
                  borderColor: focused === 'username' ? '#667eea' : 'rgba(102,126,234,0.2)',
                  boxShadow: focused === 'username' ? '0 0 0 3px rgba(102,126,234,0.15)' : 'none',
                  backgroundColor: focused === 'username' ? 'rgba(15,23,42,0.9)' : 'rgba(15,23,42,0.6)',
                }}
              />
            </div>

            {/* Email */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <span style={styles.labelIcon}>📧</span> Email Address
              </label>
              <input
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused('')}
                required
                style={{
                  ...styles.input,
                  borderColor: focused === 'email' ? '#667eea' : 'rgba(102,126,234,0.2)',
                  boxShadow: focused === 'email' ? '0 0 0 3px rgba(102,126,234,0.15)' : 'none',
                  backgroundColor: focused === 'email' ? 'rgba(15,23,42,0.9)' : 'rgba(15,23,42,0.6)',
                }}
              />
            </div>

            {/* Timezone */}
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <span style={styles.labelIcon}>🌍</span> Timezone
              </label>
              <div style={styles.selectWrapper}>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  onFocus={() => setFocused('timezone')}
                  onBlur={() => setFocused('')}
                  style={{
                    ...styles.input,
                    ...styles.select,
                    borderColor: focused === 'timezone' ? '#667eea' : 'rgba(102,126,234,0.2)',
                    boxShadow: focused === 'timezone' ? '0 0 0 3px rgba(102,126,234,0.15)' : 'none',
                    backgroundColor: focused === 'timezone' ? 'rgba(15,23,42,0.9)' : 'rgba(15,23,42,0.6)',
                  }}
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz} style={{ background: '#1e293b', color: '#e2e8f0' }}>
                      {tz}
                    </option>
                  ))}
                </select>
                <span style={styles.selectArrow}>▾</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.8 : 1,
                transform: loading ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              {loading ? (
                <>
                  <span style={styles.spinner} />
                  Subscribing…
                </>
              ) : (
                <>
                  <span>✨</span>
                  Subscribe Now
                </>
              )}
            </button>
          </form>

          {/* Alert */}
          {message && (
            <div
              style={{
                ...styles.alert,
                backgroundColor:
                  messageType === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                borderColor: messageType === 'success' ? 'rgba(16,185,129,0.5)' : 'rgba(239,68,68,0.5)',
                color: messageType === 'success' ? '#10b981' : '#ef4444',
                animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {message}
            </div>
          )}

          {/* Features */}
          <div style={styles.featuresList}>
            <p style={styles.featuresTitle}>✨ Why Choose Us?</p>
            <div style={styles.featuresGrid}>
              <FeatureItem icon="⏰" title="Smart Timing" desc="3 reminders at optimal times" />
              <FeatureItem icon="✅" title="Auto-stop" desc="Stops once you solve it" />
              <FeatureItem icon="🔐" title="Private" desc="Your data stays secure" />
              <FeatureItem icon="🚀" title="No Spam" desc="Only daily problem alerts" />
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div style={styles.testimonialCard}>
          <p style={styles.testimonialText}>
            "This app helped me maintain a consistent 100-day coding streak and never miss a challenge!"
            <span style={styles.testimonialAuthor}>— Competitive Programmer</span>
          </p>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>Built with ❤️ for the LeetCode community</p>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, title, desc }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div 
      style={{
        ...styles.featureItem,
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 24px rgba(102,126,234,0.2)' : '0 4px 12px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.featureIcon}>{icon}</div>
      <h4 style={styles.featureTitle}>{title}</h4>
      <p style={styles.featureDesc}>{desc}</p>
    </div>
  );
}

function VerifyPage() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Verifying your email…');
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      if (!token) { setMessage('❌ Invalid verification link'); setStatus('error'); return; }

      try {
        const res = await fetch(`${API_URL}/api/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage('✅ Email verified successfully!');
          setStatus('success');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setMessage(data.error || '❌ Verification failed');
          setStatus('error');
        }
      } catch (err) {
        setMessage('❌ Connection error');
        setStatus('error');
        console.error(err);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return <StatusPage status={status} message={message} title="Email Verification" navigate={navigate} />;
}

function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState('Processing your request…');
  const [status, setStatus] = useState('loading');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = async () => {
      const token = searchParams.get('token');
      if (!token) { setMessage('❌ Invalid unsubscribe link'); setStatus('error'); return; }

      try {
        const res = await fetch(`${API_URL}/api/unsubscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage('👋 You have been unsubscribed');
          setStatus('success');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setMessage(data.error || '❌ Unsubscribe failed');
          setStatus('error');
        }
      } catch (err) {
        setMessage('❌ Connection error');
        setStatus('error');
        console.error(err);
      }
    };

    unsubscribe();
  }, [searchParams, navigate]);

  return <StatusPage status={status} message={message} title="Unsubscribe" navigate={navigate} />;
}

function StatusPage({ status, message, title, navigate }) {
  const icon = status === 'loading' ? '⏳' : status === 'success' ? '✅' : '❌';

  return (
    <div style={styles.pageContainer}>
      <style>{keyframes}</style>
      <div style={styles.backgroundBlobs} />
      <div style={styles.container}>
        <div style={styles.statusCard}>
          <div
            style={{
              ...styles.statusIcon,
              animation: status === 'loading' ? 'spin 1s linear infinite' : 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
              color: status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#667eea',
            }}
          >
            {icon}
          </div>
          <h2 style={styles.statusTitle}>{title}</h2>
          <p style={styles.statusMessage}>{message}</p>
          {status === 'success' && <p style={styles.redirectText}>Redirecting to home page…</p>}
          {status === 'error' && (
            <button onClick={() => navigate('/')} style={styles.submitButton}>
              ← Back to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SubscribePage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/unsubscribe" element={<UnsubscribePage />} />
      </Routes>
    </Router>
  );
}

const keyframes = `
  @keyframes slideUp {
    from { 
      opacity: 0; 
      transform: translateY(12px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes float {
    0%, 100% { 
      transform: translateY(0px) rotate(0deg); 
    }
    50% { 
      transform: translateY(-20px) rotate(2deg); 
    }
  }
  @keyframes scaleIn {
    from { 
      opacity: 0;
      transform: scale(0.5);
    }
    to { 
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes glow {
    0%, 100% { 
      box-shadow: 0 0 20px rgba(102,126,234,0.3), inset 0 1px 0 rgba(255,255,255,0.06);
    }
    50% { 
      box-shadow: 0 0 40px rgba(102,126,234,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
    }
  }
`;

const styles = {
  pageContainer: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1a1f3a 25%, #1e293b 50%, #16213e 75%, #0f1729 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", sans-serif',
  },
  backgroundBlobs: {
    position: 'absolute',
    inset: 0,
    background: `
      radial-gradient(circle at 20% 50%, rgba(99,102,241,0.12) 0%, transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(139,92,246,0.12) 0%, transparent 40%),
      radial-gradient(circle at 40% 20%, rgba(59,130,246,0.08) 0%, transparent 40%),
      radial-gradient(circle at 60% 60%, rgba(168,85,247,0.08) 0%, transparent 50%)
    `,
    zIndex: 0,
    pointerEvents: 'none',
  },
  floatingElements: {
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
  },
  floatingElement: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(102,126,234,0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    filter: 'blur(40px)',
  },
  container: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '550px',
    margin: '0 auto',
    padding: '60px 20px 80px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  headerSection: {
    textAlign: 'center',
    animation: 'slideUp 0.6s ease-out',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)',
    border: '1px solid rgba(99,102,241,0.4)',
    borderRadius: '24px',
    color: '#a5b4fc',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    backdropFilter: 'blur(10px)',
  },
  mainTitle: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#e0e7ff',
    margin: 0,
    lineHeight: '1.2',
    letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '15px',
    color: '#cbd5e1',
    margin: 0,
    lineHeight: '1.7',
    maxWidth: '420px',
  },
  glassCard: {
    background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(30,41,59,0.7) 100%)',
    backdropFilter: 'blur(30px)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)',
    animation: 'slideUp 0.6s ease-out 0.1s both',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#cbd5e1',
    letterSpacing: '0.6px',
    textTransform: 'uppercase',
  },
  labelIcon: {
    fontSize: '16px',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    background: 'rgba(15,23,42,0.6)',
    border: '1.5px solid rgba(102,126,234,0.2)',
    borderRadius: '10px',
    color: '#e2e8f0',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'inherit',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxSizing: 'border-box',
    outline: 'none',
  },
  selectWrapper: {
    position: 'relative',
  },
  select: {
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    paddingRight: '36px',
  },
  selectArrow: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
    fontSize: '12px',
    pointerEvents: 'none',
    fontWeight: 'bold',
  },
  submitButton: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 15px rgba(102,126,234,0.35)',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2.5px solid rgba(255,255,255,0.3)',
    borderTop: '2.5px solid white',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    flexShrink: 0,
  },
  alert: {
    marginTop: '18px',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1.5px solid',
    borderLeft: '4px solid',
    fontSize: '14px',
    fontWeight: '500',
    lineHeight: '1.6',
  },
  featuresList: {
    marginTop: '28px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(148,163,184,0.15)',
  },
  featuresTitle: {
    fontSize: '12px',
    fontWeight: '800',
    color: '#94a3b8',
    margin: '0 0 14px 0',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  featureItem: {
    textAlign: 'center',
    padding: '16px 12px',
    background: 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(30,41,59,0.3) 100%)',
    border: '1px solid rgba(102,126,234,0.1)',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    cursor: 'default',
  },
  featureIcon: {
    fontSize: '24px',
    marginBottom: '8px',
    display: 'block',
  },
  featureTitle: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#cbd5e1',
    margin: '0 0 4px 0',
  },
  featureDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.5',
  },
  testimonialCard: {
    background: 'linear-gradient(135deg, rgba(30,41,59,0.7) 0%, rgba(30,41,59,0.4) 100%)',
    border: '1px solid rgba(148,163,184,0.15)',
    borderRadius: '12px',
    padding: '20px 24px',
    textAlign: 'center',
    animation: 'slideUp 0.6s ease-out 0.2s both',
    backdropFilter: 'blur(10px)',
  },
  testimonialText: {
    fontSize: '14px',
    color: '#cbd5e1',
    margin: 0,
    fontStyle: 'italic',
    lineHeight: '1.7',
    fontWeight: '500',
  },
  testimonialAuthor: {
    display: 'block',
    marginTop: '8px',
    fontSize: '12px',
    color: '#94a3b8',
    fontStyle: 'normal',
    fontWeight: '700',
    letterSpacing: '0.4px',
  },
  statusCard: {
    background: 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(30,41,59,0.7) 100%)',
    backdropFilter: 'blur(30px)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '16px',
    padding: '60px 40px',
    textAlign: 'center',
    animation: 'slideUp 0.6s ease-out 0.1s both',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  statusIcon: {
    fontSize: '56px',
    marginBottom: '20px',
    display: 'block',
  },
  statusTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#e0e7ff',
    margin: '0 0 14px 0',
  },
  statusMessage: {
    fontSize: '16px',
    color: '#cbd5e1',
    margin: '0 0 24px 0',
    lineHeight: '1.6',
  },
  redirectText: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '0 0 12px 0',
    animation: 'float 3s ease-in-out infinite',
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    animation: 'slideUp 0.6s ease-out 0.3s both',
  },
  footerText: {
    fontSize: '13px',
    color: '#64748b',
    margin: 0,
    fontWeight: '500',
  },
};

export default App;