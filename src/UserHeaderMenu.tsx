import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { PrivacySettingsModal } from './PrivacySettingsModal';
import { Icon } from './components';

const ADMIN_EMAILS = ['coleslaysolutions@gmail.com', 'coleduane96@gmail.com'];

export function UserHeaderMenu() {
  const { user, profile, logout, openAuthModal } = useAuth();
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  if (!user) {
    return (
      <button
        className="button small"
        onClick={() => openAuthModal('signin')}
        type="button"
      >
        Sign in
        <Icon name="arrow" />
      </button>
    );
  }

  const initial = (profile?.displayName || user.email || 'U').charAt(0).toUpperCase();
  const isAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  return (
    <>
      <div className="user-menu" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
        <div className="user-avatar" title={profile?.email || user.email || ''}>
          {profile?.photoURL ? (
            <img src={profile.photoURL} alt="" />
          ) : (
            <span>{initial}</span>
          )}
        </div>
        <div className="user-badge">
          <span className="user-name">{profile?.displayName || 'Vibe Builder'}</span>
          <span className="user-role" style={{ color: isAdmin ? '#ef4444' : '#64748b', fontSize: '11px', fontWeight: isAdmin ? 700 : 400 }}>
            {profile?.accountStatus === 'pending_deletion' ? '⚠️ Deletion Pending' : isAdmin ? '⚡ Admin' : 'Verified Builder'}
          </span>
        </div>

        {isAdmin && (
          <Link
            to="/ops-nexus-903f"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>⚡ Admin Command</span>
          </Link>
        )}

        <button
          type="button"
          onClick={() => setPrivacyModalOpen(true)}
          title="Manage data privacy, export records, or request deletion"
          style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span style={{ fontSize: '11px' }}>🛡️</span>
          <span>Privacy &amp; Data</span>
        </button>

        <button
          className="text-button"
          onClick={() => logout()}
          title="Sign out"
          type="button"
        >
          Sign out
        </button>
      </div>

      <PrivacySettingsModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />
    </>
  );
}
