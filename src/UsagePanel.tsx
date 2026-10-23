import { useState } from 'react';
import { useUsage } from './UsageContext';
import { SEATS_CLAIMED } from './plans';
import { Icon } from './components';

export function UsagePanel() {
  const {
    planId,
    currentPlan,
    connectedApps,
    scansUsed,
    companionUsed,
    resetDate,
    setPlan,
    setUsage,
    isDevMode,
    openWaitlistModal,
  } = useUsage();

  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Meter calculations
  const appLimit = currentPlan.apps;
  const appPercent = Math.min(100, Math.round((connectedApps.length / appLimit) * 100));

  const scanLimit = currentPlan.scansPerMonth;
  const scanPercent = Math.min(100, Math.round((scansUsed / scanLimit) * 100));

  const messageLimit = currentPlan.companionPerMonth;
  const messagePercent = Math.min(100, Math.round((companionUsed / messageLimit) * 100));

  const getMeterColor = (percent: number) => {
    if (percent >= 100) return '#dc2626'; // critical
    if (percent >= 80) return '#d97706'; // warning
    return 'var(--ink)'; // charcoal (<80%)
  };

  return (
    <div className="surface usage-panel-card" style={{ padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div className="section-kicker" style={{ marginBottom: '4px' }}>PLAN & USAGE</div>
          <h2 style={{ fontSize: '18px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{currentPlan.name} Plan</span>
            <span
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                borderRadius: '12px',
                background: 'var(--soft-blue)',
                color: 'var(--blue)',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Active
            </span>
          </h2>
        </div>

        <button className="button secondary small" onClick={() => setIsCompareOpen(true)}>
          Compare plans
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        {/* Connected Apps Meter */}
        <div className="meter-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 550, color: 'var(--ink)' }}>Connected Apps</span>
            <span style={{ color: 'var(--muted)' }}>
              {connectedApps.length} of {appLimit}
            </span>
          </div>
          <div
            style={{
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              role="progressbar"
              aria-label="Connected Apps usage meter"
              aria-valuenow={connectedApps.length}
              aria-valuemin={0}
              aria-valuemax={appLimit}
              style={{
                height: '100%',
                width: `${appPercent}%`,
                background: getMeterColor(appPercent),
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {appPercent >= 100 ? (
            <p className="subtle" style={{ color: '#dc2626', marginTop: '6px' }}>
              App limit reached on Free plan ({appLimit} connected app).
            </p>
          ) : appPercent >= 80 ? (
            <p className="subtle" style={{ color: '#d97706', marginTop: '6px' }}>
              0 app slots left. Upgrade for 5 apps.
            </p>
          ) : null}
        </div>

        {/* Fresh Scans Meter */}
        <div className="meter-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 550, color: 'var(--ink)' }}>Fresh Scans</span>
            <span style={{ color: 'var(--muted)' }}>
              {scansUsed} of {scanLimit}
            </span>
          </div>
          <div
            style={{
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              role="progressbar"
              aria-label="Fresh Scans usage meter"
              aria-valuenow={scansUsed}
              aria-valuemin={0}
              aria-valuemax={scanLimit}
              style={{
                height: '100%',
                width: `${scanPercent}%`,
                background: getMeterColor(scanPercent),
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {scanPercent >= 100 ? (
            <p className="subtle" style={{ color: '#dc2626', marginTop: '6px' }}>
              3 of 3 scans used. Resets {resetDate}.
            </p>
          ) : scanPercent >= 80 ? (
            <p className="subtle" style={{ color: '#d97706', marginTop: '6px' }}>
              {scanLimit - scansUsed} scan left this month.
            </p>
          ) : null}
        </div>

        {/* Companion Messages Meter */}
        <div className="meter-item">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ fontWeight: 550, color: 'var(--ink)' }}>Companion Messages</span>
            <span style={{ color: 'var(--muted)' }}>
              {companionUsed} of {messageLimit}
            </span>
          </div>
          <div
            style={{
              height: '8px',
              background: '#e5e7eb',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              role="progressbar"
              aria-label="Companion messages usage meter"
              aria-valuenow={companionUsed}
              aria-valuemin={0}
              aria-valuemax={messageLimit}
              style={{
                height: '100%',
                width: `${messagePercent}%`,
                background: getMeterColor(messagePercent),
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          {messagePercent >= 100 ? (
            <p className="subtle" style={{ color: '#dc2626', marginTop: '6px' }}>
              15 messages reached. Resets {resetDate}.
            </p>
          ) : messagePercent >= 80 ? (
            <p className="subtle" style={{ color: '#d97706', marginTop: '6px' }}>
              {messageLimit - companionUsed} companion messages remaining.
            </p>
          ) : null}
        </div>
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <p className="subtle" style={{ fontSize: '11px', color: 'var(--muted)' }}>
          Usage resets on <strong>{resetDate}</strong>. Re-viewing existing scan reports does not count towards limits.
        </p>

        {/* DEV MODE TESTING CONTROLS */}
        {isDevMode && (
          <div
            style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              padding: '6px 12px',
              borderRadius: '6px',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              fontSize: '11px',
            }}
          >
            <strong>DEV TOOLS:</strong>
            <button className="text-button" style={{ fontSize: '11px', padding: 0 }} onClick={() => setPlan('free')}>
              Set Free
            </button>
            <button className="text-button" style={{ fontSize: '11px', padding: 0 }} onClick={() => setPlan('pro')}>
              Set Pro
            </button>
            <button
              className="text-button"
              style={{ fontSize: '11px', padding: 0 }}
              onClick={() => setUsage(3, 15, 1)}
            >
              Max Free Usage
            </button>
            <button className="text-button" style={{ fontSize: '11px', padding: 0 }} onClick={() => setUsage(0, 0, 1)}>
              Reset Usage
            </button>
          </div>
        )}
      </div>

      {/* PLAN COMPARISON MODAL */}
      {isCompareOpen && (
        <div className="auth-modal-scrim" onClick={() => setIsCompareOpen(false)}>
          <div
            className="auth-modal-card"
            style={{ width: 'min(900px, 95vw)', padding: '32px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <div>
                <h2 style={{ fontSize: '24px' }}>Compare Sentinel Plans</h2>
                <p className="subtle" style={{ marginTop: '4px' }}>
                  Select the plan that fits your application pipeline.
                </p>
              </div>
              <button className="icon-button" onClick={() => setIsCompareOpen(false)}>
                <Icon name="close" />
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginTop: '20px',
              }}
            >
              {/* Free Plan */}
              <div
                style={{
                  border: planId === 'free' ? '2px solid var(--blue)' : '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'var(--paper)',
                }}
              >
                {planId === 'free' && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      background: 'var(--soft-blue)',
                      color: 'var(--blue)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Your current plan
                  </span>
                )}
                <h3 style={{ fontSize: '18px', marginTop: '8px' }}>Free</h3>
                <p style={{ fontSize: '20px', fontWeight: 650, margin: '8px 0' }}>$0</p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                  1 app, 3 fresh scans/month, 15 companion messages.
                </p>
                {planId === 'free' ? (
                  <button className="button secondary small" disabled style={{ width: '100%' }}>
                    Active Plan
                  </button>
                ) : (
                  <button className="button secondary small" onClick={() => setPlan('free')} style={{ width: '100%' }}>
                    Switch to Free
                  </button>
                )}
              </div>

              {/* Pro Plan */}
              <div
                style={{
                  border: planId === 'pro' ? '2px solid var(--blue)' : '2px solid var(--blue)',
                  borderRadius: '8px',
                  padding: '20px',
                  background: '#fafbfd',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    background: 'var(--blue)',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    textTransform: 'uppercase',
                  }}
                >
                  Founding Access
                </span>
                <h3 style={{ fontSize: '18px', marginTop: '8px' }}>Pro</h3>
                <p style={{ fontSize: '20px', fontWeight: 650, margin: '8px 0' }}>$12 <span style={{ fontSize: '12px', fontWeight: 400 }}>/ mo</span></p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                  5 apps, 30 fresh scans/month, 300 companion messages, full history.
                </p>
                <button
                  className="button small"
                  onClick={() => {
                    setIsCompareOpen(false);
                    openWaitlistModal('pro', 'monthly');
                  }}
                  style={{ width: '100%' }}
                >
                  Join founding access
                </button>
              </div>

              {/* Lifetime Plan */}
              <div
                style={{
                  border: planId === 'lifetime' ? '2px solid var(--blue)' : '1px solid var(--line)',
                  borderRadius: '8px',
                  padding: '20px',
                  background: 'var(--paper)',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    background: '#f3f4f6',
                    color: 'var(--ink)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    textTransform: 'uppercase',
                  }}
                >
                  100 Seats Cap
                </span>
                <h3 style={{ fontSize: '18px', marginTop: '8px' }}>Founding Lifetime</h3>
                <p style={{ fontSize: '20px', fontWeight: 650, margin: '8px 0' }}>$149 <span style={{ fontSize: '12px', fontWeight: 400 }}>one-time</span></p>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
                  Lifetime access for founding supporters. Seats claimed: {SEATS_CLAIMED} of 100.
                </p>
                <button
                  className="button secondary small"
                  onClick={() => {
                    setIsCompareOpen(false);
                    openWaitlistModal('lifetime', 'once');
                  }}
                  style={{ width: '100%' }}
                >
                  Join founding access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
