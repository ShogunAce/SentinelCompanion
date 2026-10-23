import { useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { AuthModal } from './AuthModal';
import { ActionLink, Icon } from './components';

export function ProtectedWorkspaceGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', justifyContent: 'center' }}>
        <span className="empty-icon"><Icon name="shield" /></span>
        <h3>Verifying authentication...</h3>
        <p>Checking security credentials via Firebase Auth.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="surface" style={{ maxWidth: '640px', margin: '60px auto', padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--soft-blue)', color: 'var(--blue)', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <Icon name="shield" />
        </div>
        <h2 style={{ fontSize: '26px', marginBottom: '12px' }}>Authentication Required</h2>
        <p style={{ fontSize: '14px', color: 'var(--muted)', maxWidth: '480px', margin: '0 auto 28px', lineHeight: '1.6' }}>
          The Sentinel workspace is restricted to registered users to secure vulnerability reports and isolate fix prompts against IDOR attacks.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="button" onClick={() => setAuthModalOpen(true)}>
            Sign in or Create Account
            <Icon name="arrow" />
          </button>
          <ActionLink to="/" secondary>
            Back to Home
          </ActionLink>
        </div>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          title="Sign in to access workspace"
          subtitle="Create an account or sign in to view security scans and AI prompt fixes"
        />
      </div>
    );
  }

  return <>{children}</>;
}
