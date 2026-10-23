import { useState, useEffect } from 'react';

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  companionMemory: boolean;
  consentedAt: string;
}

const STORAGE_KEY = 'sentinel_cookie_preferences_v1';
const SESSION_DISMISSED_KEY = 'sentinel_cookie_preferences_dismissed';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    companionMemory: true,
    consentedAt: '',
  });

  useEffect(() => {
    try {
      const sessionDismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (sessionDismissed === '1') {
        setShowBanner(false);
        if (stored) {
          setPreferences(JSON.parse(stored));
        }
      } else if (stored) {
        setPreferences(JSON.parse(stored));
        setShowBanner(false);
      } else {
        setShowBanner(true);
      }
    } catch {
      // If storage restricted, avoid re-prompting during session
      setShowBanner(false);
    }

    // Reopen listener
    const openHandler = () => {
      setShowModal(true);
    };
    window.addEventListener('sentinel:open-cookie-preferences', openHandler);
    return () => window.removeEventListener('sentinel:open-cookie-preferences', openHandler);
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    const updated = {
      ...prefs,
      essential: true,
      consentedAt: new Date().toISOString(),
    };
    setPreferences(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      sessionStorage.setItem(SESSION_DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
    setShowBanner(false);
    setShowModal(false);
  };

  const dismissForSession = () => {
    try {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, '1');
    } catch {
      // ignore
    }
    setShowBanner(false);
    setShowModal(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      companionMemory: true,
      consentedAt: '',
    });
  };

  const handleRejectNonEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      companionMemory: false,
      consentedAt: '',
    });
  };

  return (
    <>
      {/* Quick Bottom Consent Banner */}
      {showBanner && !showModal && (
        <div
          role="region"
          aria-label="Cookie and Privacy Consent"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            right: '20px',
            maxWidth: '560px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(16px)',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            padding: '18px 20px',
            boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
            zIndex: 99990,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>🍪</span>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Global Privacy &amp; Cookie Compliance
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                Sentinel complies with global privacy regulations (GDPR, CCPA/CPRA, and ePrivacy). We use essential cookies to maintain secure sessions and prevent unauthorized access. You control optional analytics and AI companion personalization.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                background: 'transparent',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              Customize Preferences
            </button>
            <button
              type="button"
              onClick={handleRejectNonEssential}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0f172a',
                cursor: 'pointer',
              }}
            >
              Essential Only
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              style={{
                background: '#1f3bd6',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
              }}
            >
              Accept All
            </button>
          </div>
        </div>
      )}

      {/* Detailed Customization Modal */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 99998,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 id="cookie-modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Privacy &amp; Cookie Preferences
              </h3>
              <button
                type="button"
                onClick={dismissForSession}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, marginBottom: '20px' }}>
              We respect your right to privacy under GDPR (Articles 6, 7 &amp; 13) and CCPA/CPRA. Review and adjust your preferences below. Essential security cookies cannot be deactivated as they are required for app integrity and authentication.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {/* Category 1: Essential */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Strictly Necessary &amp; Security</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '9999px' }}>
                    Always Active
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                  Required for Firebase authentication, CSRF tokens, anti-abuse rate limiting, and origin defense. No marketing data is collected.
                </p>
              </div>

              {/* Category 2: Analytics & Telemetry */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Performance &amp; Diagnostics</span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </label>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                  Measures anonymized scan duration and polite crawler latency to maintain high scanning accuracy and eliminate false positives.
                </p>
              </div>

              {/* Category 3: Companion Memory */}
              <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Companion Personalization</span>
                  <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={preferences.companionMemory}
                      onChange={(e) => setPreferences({ ...preferences, companionMemory: e.target.checked })}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                  </label>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                  Enables Sentinel's robot widget to remember your selected AI code builder (Cursor, Bolt, Lovable, v0) and floating screen position across visits.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {preferences.consentedAt ? `Last saved: ${new Date(preferences.consentedAt).toLocaleDateString()}` : 'Default policy active'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleRejectNonEssential}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  Essential Only
                </button>
                <button
                  type="button"
                  onClick={() => savePreferences(preferences)}
                  style={{
                    background: '#1f3bd6',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  Save Choices
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
