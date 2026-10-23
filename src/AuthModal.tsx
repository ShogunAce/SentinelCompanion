import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Icon } from './components';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function AuthModal({ isOpen, onClose, title = "Sign in to Sentinel", subtitle = "Your account protects your scans and fix prompts" }: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (!email.trim() || !password.trim()) {
          setError('Please provide an email and password.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        await signUpWithEmail(email.trim(), password, displayName.trim());
      } else {
        await signInWithEmail(email.trim(), password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Must be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Google Sign-In failed or was cancelled.');
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

        <h2 id="auth-modal-title">{title}</h2>
        <p className="auth-modal-sub">{subtitle}</p>

        {error && <div className="auth-error-banner" role="alert">{error}</div>}

        <button className="google-auth-btn" onClick={handleGoogle} disabled={loading}>
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
              <label htmlFor="auth-name">Your name</label>
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
            <label htmlFor="auth-email">Email address</label>
            <input
              id="auth-email"
              type="email"
              required
              placeholder="alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="button auth-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : isSignUp ? 'Create account' : 'Sign in'}
            <Icon name="arrow" />
          </button>
        </form>

        <div className="auth-toggle">
          <span>{isSignUp ? 'Already have an account?' : 'Don’t have an account?'}</span>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
          >
            {isSignUp ? 'Sign in instead' : 'Create an account'}
          </button>
        </div>
      </div>
    </div>
  );
}
