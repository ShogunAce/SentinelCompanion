import { useState } from 'react';
import { useAuth } from './AuthContext';
import { exportUserData, requestAccountDeletion, cancelAccountDeletion, deleteUserScans } from './firebase';

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacySettingsModal({ isOpen, onClose }: PrivacySettingsModalProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearScansConfirm, setShowClearScansConfirm] = useState(false);

  if (!isOpen || !user) return null;

  const isPendingDeletion = profile?.accountStatus === 'pending_deletion';

  const handleExportData = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await exportUserData(user.uid);
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sentinel-user-data-${user.uid.slice(0, 8)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccessMsg('Your data package has been generated and downloaded (GDPR Article 20).');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export your data.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearScans = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const count = await deleteUserScans(user.uid);
      setSuccessMsg(`Successfully purged ${count} scan record(s) from your account history.`);
      setShowClearScansConfirm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to clear scans.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestDeletion = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await requestAccountDeletion(user.uid);
      setSuccessMsg(
        `Account deletion initiated. You have a 15-day grace period (until ${new Date(res.gracePeriodEndsAt).toLocaleDateString()}) to change your mind. Permanent purge scheduled within 45 days.`
      );
      setShowDeleteConfirm(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request deletion.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await cancelAccountDeletion(user.uid);
      setSuccessMsg('Deletion request successfully cancelled. Your account remains active.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel deletion.');
    } finally {
      setLoading(false);
    }
  };

  const openCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('sentinel:open-cookie-preferences'));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 99999,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          maxWidth: '580px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px 28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 id="privacy-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              Privacy &amp; Data Rights Management
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              GDPR (EU/UK), CCPA/CPRA, and LGPD Global Compliance
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              color: '#64748b',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
            ⚠ {errorMsg}
          </div>
        )}

        {/* Pending Deletion Alert Banner */}
        {isPendingDeletion && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
              <span>⚠️</span> Account Deletion Pending
            </div>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#78350f', lineHeight: 1.45 }}>
              Your deletion request was received. You have until{' '}
              <strong>{profile?.gracePeriodEndsAt ? new Date(profile.gracePeriodEndsAt).toLocaleDateString() : '15 days'}</strong>{' '}
              to change your mind before your account is closed. Permanent deletion of backups and server records will conclude within 45 days.
            </p>
            <button
              type="button"
              onClick={handleCancelDeletion}
              disabled={loading}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {loading ? 'Processing...' : 'Cancel Deletion Request (Restore Account)'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Section 1: Right of Access & Portability */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              1. Download Personal Data (Portability)
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
              Request a machine-readable JSON archive of your account profile, scan history, and generated prompt fixes. Protected against Insecure Direct Object References (IDORs) via authenticated UID path checks.
            </p>
            <button
              type="button"
              onClick={handleExportData}
              disabled={loading}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#1e293b',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>📥</span> {loading ? 'Preparing bundle...' : 'Export My Data (JSON)'}
            </button>
          </div>

          {/* Section 2: Clear Scan History */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              2. Purge Scan Activity Records
            </h4>
            <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
              Instantly delete all past website scan results and vulnerabilities logged under your UID. Keeps your account active.
            </p>

            {showClearScansConfirm ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>Are you sure?</span>
                <button
                  type="button"
                  onClick={handleClearScans}
                  disabled={loading}
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Confirm Purge
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearScansConfirm(false)}
                  style={{
                    background: 'none',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearScansConfirm(true)}
                disabled={loading}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Clear Scan History
              </button>
            )}
          </div>

          {/* Section 3: Right to Erasure (15-Day Grace / 45-Day Retention Schedule) */}
          <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '14px', border: '1px solid #fee2e2' }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>
              3. Request Account &amp; Permanent Data Deletion
            </h4>
            <div style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#7f1d1d', lineHeight: 1.5 }}>
              <p style={{ margin: '0 0 6px 0' }}>
                <strong>15-Day Grace Period:</strong> Deletion is not instant. You have 15 days from your request date to change your mind and cancel.
              </p>
              <p style={{ margin: 0 }}>
                <strong>45-Day Permanent Purge:</strong> In accordance with global privacy regulations, all telemetry, backups, and user database records are permanently deleted within 45 days.
              </p>
            </div>

            {!isPendingDeletion ? (
              showDeleteConfirm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 700 }}>
                    Confirm deletion request? (15-day grace period will start immediately)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleRequestDeletion}
                      disabled={loading}
                      style={{
                        background: '#dc2626',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {loading ? 'Submitting...' : 'Yes, Request Deletion'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  style={{
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  Request Account Deletion
                </button>
              )
            ) : (
              <span style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600 }}>
                Deletion request currently pending (see notice above to cancel).
              </span>
            )}
          </div>

          {/* Section 4: Account Security & Two-Factor Authentication */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                4. Two-Factor Authentication (2FA)
              </h4>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1f3bd6', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '9999px' }}>
                Coming Soon
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
              FIDO2/WebAuthn hardware security keys and time-based one-time password (TOTP) authenticator app support will be rolled out soon to provide extra account hardening for all builders.
            </p>
          </div>

          {/* Section 5: Cookie Preferences Link */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Cookie &amp; Tracking Consent</span>
            <button
              type="button"
              onClick={openCookiePreferences}
              style={{
                background: 'none',
                border: 'none',
                color: '#1f3bd6',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Adjust Cookie Preferences →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
