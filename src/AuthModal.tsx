import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Icon } from './components';
import { useNavigate } from 'react-router-dom';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  initialMode?: 'signin' | 'signup';
}

export function AuthModal({
  isOpen,
  onClose,
  title,
  subtitle,
  initialMode = 'signin'
}: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<{ text: string; code?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const isSignUp = mode === 'signup';

  // Password complexity checks
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    const cleanPass = password.trim();

    if (!cleanEmail || !cleanPass) {
      setError({ text: 'Please provide both your email address and password.' });
      return;
    }

    if (isSignUp && !hasMinLength) {
      setError({ text: 'Password must be at least 8 characters long.' });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        await signUpWithEmail(cleanEmail, cleanPass, displayName.trim());
      } else {
        await signInWithEmail(cleanEmail, cleanPass);
      }
      onClose();
      navigate('/workspace');
    } catch (err: any) {
      console.error('Auth error:', err);
      const errCode = err.code || '';
      const errMsg = err.message || '';

      if (errCode === 'auth/operation-not-allowed' || errMsg.includes('OPERATION_NOT_ALLOWED')) {
        setError({
          code: 'operation-not-allowed',
          text: 'Email/Password authentication is disabled in your Firebase project console. Please use "Continue with Google" to sign in immediately, or enable Email/Password under Firebase Console > Authentication > Sign-in providers.',
        });
      } else if (errCode === 'auth/user-not-found' || errCode === 'auth/invalid-credential') {
        setError({
          code: 'user-not-found',
          text: isSignUp ? 'Invalid credentials provided.' : 'No account found with this email, or password was incorrect.',
        });
      } else if (errCode === 'auth/email-already-in-use') {
        setError({
          code: 'email-already-in-use',
          text: 'An account with this email address already exists.',
        });
      } else if (errCode === 'auth/weak-password') {
        setError({
          code: 'weak-password',
          text: 'Password is too weak. Please use at least 8 characters with numbers and symbols.',
        });
      } else {
        setError({ text: errMsg || 'Authentication failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
      navigate('/workspace');
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      setError({ text: 'Google Sign-In was cancelled or encountered an error.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <div className="auth-modal-header">
          <div className="auth-brand">
            <Icon name="shield" />
            <span>Sentinel</span>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <Icon name="close" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#f1f5f9',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '20px',
          border: '1px solid #cbd5e1'
        }}>
          <button
            type="button"
            onClick={() => { setMode('signin'); setError(null); }}
            style={{
              padding: '8px',
              fontSize: '13px',
              fontWeight: mode === 'signin' ? 700 : 500,
              background: mode === 'signin' ? '#ffffff' : 'transparent',
              color: mode === 'signin' ? '#0f172a' : '#64748b',
              borderRadius: '7px',
              border: 'none',
              boxShadow: mode === 'signin' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(null); }}
            style={{
              padding: '8px',
              fontSize: '13px',
              fontWeight: mode === 'signup' ? 700 : 500,
              background: mode === 'signup' ? '#ffffff' : 'transparent',
              color: mode === 'signup' ? '#0f172a' : '#64748b',
              borderRadius: '7px',
              border: 'none',
              boxShadow: mode === 'signup' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Create Account
          </button>
        </div>

        <h2 id="auth-modal-title">
          {title || (isSignUp ? 'Create your Sentinel account' : 'Sign in to Sentinel')}
        </h2>
        <p className="auth-modal-sub">
          {subtitle || (isSignUp
            ? 'Start auditing vibecoded apps with your personal AI security companion'
            : 'Access your security scans, fix prompts, and vulnerability reports')}
        </p>

        {/* Error Banner with Smart Suggestions */}
        {error && (
          <div className="auth-error-banner" role="alert" style={{ marginBottom: '16px', lineHeight: 1.5 }}>
            <div>{error.text}</div>

            {error.code === 'user-not-found' && (
              <button
                type="button"
                onClick={() => { setMode('signup'); setError(null); }}
                style={{
                  marginTop: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Switch to Create Account →
              </button>
            )}

            {error.code === 'email-already-in-use' && (
              <button
                type="button"
                onClick={() => { setMode('signin'); setError(null); }}
                style={{
                  marginTop: '8px',
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Switch to Sign In →
              </button>
            )}
          </div>
        )}

        {/* Google OAuth Button */}
        <button className="google-auth-btn" onClick={handleGoogle} disabled={loading} type="button">
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="auth-divider">
          <span>or use email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="auth-field">
              <label htmlFor="auth-name">Your Name</label>
              <input
                id="auth-name"
                type="text"
                placeholder="e.g. Alex Rivera"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email Address</label>
            <input
              id="auth-email"
              type="email"
              required
              placeholder="alex@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="auth-password">Password</label>
            </div>
            <input
              id="auth-password"
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Password Complexity Indicators for Sign Up */}
            {isSignUp && (
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
                marginTop: '8px',
                fontSize: '11px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px 10px',
              }}>
                <span style={{ color: hasMinLength ? '#16a34a' : '#94a3b8', fontWeight: hasMinLength ? 600 : 400 }}>
                  {hasMinLength ? '✓' : '•'} 8+ characters
                </span>
                <span style={{ color: hasUpper ? '#16a34a' : '#94a3b8', fontWeight: hasUpper ? 600 : 400 }}>
                  {hasUpper ? '✓' : '•'} Uppercase letter
                </span>
                <span style={{ color: hasLower ? '#16a34a' : '#94a3b8', fontWeight: hasLower ? 600 : 400 }}>
                  {hasLower ? '✓' : '•'} Lowercase letter
                </span>
                <span style={{ color: hasNumber ? '#16a34a' : '#94a3b8', fontWeight: hasNumber ? 600 : 400 }}>
                  {hasNumber ? '✓' : '•'} Number (0-9)
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="button auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : isSignUp ? 'Create account' : 'Sign in'}
            <Icon name="arrow" />
          </button>
        </form>

        {/* 2FA Coming Soon Notice */}
        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <span style={{ fontSize: '13px' }}>🛡️</span>
          <span>Two-Factor Authentication (2FA) coming soon</span>
        </div>
      </div>
    </div>
  );
}
