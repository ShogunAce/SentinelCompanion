import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { AuthModal } from './AuthModal';
import { Icon } from './components';

const ADMIN_EMAILS = ['coleslaysolutions@gmail.com', 'coleduane96@gmail.com'];

export function UserHeaderMenu() {
  const { user, profile, logout } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  if (!user) {
    return (
      <>
        <button
          className="button small"
          onClick={() => setAuthModalOpen(true)}
          type="button"
        >
          Sign in
          <Icon name="arrow" />
        </button>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  const initial = (profile?.displayName || user.email || 'U').charAt(0).toUpperCase();
  const isAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  return (
    <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div className="user-avatar" title={profile?.email || user.email || ''}>
        {profile?.photoURL ? (
          <img src={profile.photoURL} alt="" />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      <div className="user-badge">
        <span className="user-name">{profile?.displayName || 'Vibe Builder'}</span>
        <span className="user-role" style={{ color: isAdmin ? '#ef4444' : '#9ca3af', fontWeight: isAdmin ? 700 : 400 }}>
          {isAdmin ? 'System Admin' : 'Authenticated Builder'}
        </span>
      </div>

      {isAdmin && (
        <Link
          to="/ops-nexus-903f"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.3rem 0.6rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}
          title="Open Admin Operations Console"
        >
          Ops Console
        </Link>
      )}

      <button
        className="text-button"
        onClick={() => logout()}
        title="Sign out"
        type="button"
      >
        Sign out
      </button>
    </div>
  );
}
