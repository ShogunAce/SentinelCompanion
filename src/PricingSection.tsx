import { useState } from 'react';
import { PLANS, SEATS_CLAIMED } from './plans';
import { useUsage } from './UsageContext';
import { useNavigate } from 'react-router-dom';
import { Icon } from './components';

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const { openWaitlistModal } = useUsage();
  const navigate = useNavigate();

  const handleFreeClick = () => {
    navigate('/workspace/new-scan');
  };

  return (
    <section id="pricing" className="section pricing-section">
      <div className="container">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 48px' }}>
          <div className="section-kicker">HONEST PRICING</div>
          <h2 style={{ fontSize: 'clamp(32px, 3.8vw, 48px)', letterSpacing: '-0.03em' }}>
            Pricing that matches what the companion <em>actually costs</em>.
          </h2>
          <p style={{ marginTop: '14px', fontSize: '15px', color: 'var(--muted)', lineHeight: 1.6 }}>
            Every scan and AI message requires real computing resources. Our free plan covers early development needs, while founding plans support growing apps.
          </p>

          {/* Monthly / Annual Toggle for Pro */}
          <div
            className="inline-flex max-w-full flex-wrap sm:flex-nowrap justify-center gap-1.5 sm:gap-3 p-1.5 rounded-full border border-[var(--line)] bg-[#eaece5] mt-6"
          >
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[var(--ink)] shadow-sm'
                  : 'bg-transparent text-[var(--muted)]'
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                billingCycle === 'annual'
                  ? 'bg-white text-[var(--ink)] shadow-sm'
                  : 'bg-transparent text-[var(--muted)]'
              }`}
            >
              Annual billing (Save $45)
            </button>
          </div>
        </div>

        {/* 3 Plan Cards Grid */}
        <div className="pricing-grid">
          {/* FREE CARD */}
          <article className="pricing-card">
            <div className="card-top">
              <span className="plan-badge">Available Today</span>
              <h3 className="plan-name">{PLANS.free.name}</h3>
              <div className="price-tag">
                <span className="amount">$0</span>
                <span className="period">/ month</span>
              </div>
              <p className="plan-desc">For individual builders and early prototypes testing security baseline.</p>
            </div>
            <button className="button secondary" onClick={handleFreeClick} style={{ width: '100%', marginTop: '20px' }}>
              Start free
              <Icon name="arrow" />
            </button>
            <ol className="feature-list">
              <li>
                <Icon name="check" className="check-icon" />
                <span>{PLANS.free.apps} connected app</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>{PLANS.free.scansPerMonth} fresh scans per month</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>{PLANS.free.companionPerMonth} companion messages per month</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>Latest report history</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>Manual on-demand rescans</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>Top 3 copy-paste fix prompts</span>
              </li>
              <li className="dimmed">
                <span>No deep checks</span>
              </li>
            </ol>
          </article>

          {/* PRO CARD (Emphasized) */}
          <article className="pricing-card emphasized">
            <div className="card-top">
              <div className="card-header-row">
                <span className="plan-badge featured">Most builders pick this</span>
                <span className="status-tag">Founding access, opening soon</span>
              </div>
              <h3 className="plan-name">{PLANS.pro.name}</h3>
              <div className="price-tag">
                {billingCycle === 'monthly' ? (
                  <>
                    <span className="amount">${PLANS.pro.price}</span>
                    <span className="period">/ month</span>
                  </>
                ) : (
                  <>
                    <span className="amount">${PLANS.pro.annualPrice}</span>
                    <span className="period">/ year</span>
                  </>
                )}
              </div>
              <p className="plan-desc">
                {billingCycle === 'annual'
                  ? 'Save $45 a year when billed annually.'
                  : 'Full coverage for active builders running multiple vibecoded projects.'}
              </p>
            </div>
            <button
              className="button"
              onClick={() => openWaitlistModal('pro', billingCycle)}
              style={{ width: '100%', marginTop: '20px' }}
            >
              Join founding access
            </button>
            <ol className="feature-list">
              <li>
                <Icon name="check" className="check-icon" />
                <span>{PLANS.pro.apps} connected apps</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>{PLANS.pro.scansPerMonth} fresh scans per month</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>{PLANS.pro.companionPerMonth} companion messages per month</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>Full report history</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>Weekly automated rescan</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>All copy-paste fix prompts</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>Deep checks: Added later, only after you prove you own the domain.</span>
              </li>
            </ol>
          </article>

          {/* LIFETIME CARD */}
          <article className="pricing-card quiet">
            <div className="card-top">
              <div className="card-header-row">
                <span className="plan-badge quiet">100 founding seats</span>
                <span className="status-tag">Founding access, opening soon</span>
              </div>
              <h3 className="plan-name">{PLANS.lifetime.name}</h3>
              <div className="price-tag">
                <span className="amount">${PLANS.lifetime.price}</span>
                <span className="period">one-time</span>
              </div>
              <p className="plan-desc">One pay pass for founding supporters. Seats claimed: {SEATS_CLAIMED} of 100.</p>
            </div>
            <button
              className="button secondary"
              onClick={() => openWaitlistModal('lifetime', 'once')}
              style={{ width: '100%', marginTop: '20px' }}
            >
              Join founding access
            </button>
            <ol className="feature-list">
              <li>
                <Icon name="check" className="check-icon" />
                <span>{PLANS.lifetime.apps} connected apps</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>{PLANS.lifetime.scansPerMonth} fresh scans per month</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>{PLANS.lifetime.companionPerMonth} companion messages per month</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>Full report history</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>Weekly automated rescan</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>All copy-paste fix prompts</span>
              </li>
              <li>
                <Icon name="check" className="check-icon" />
                <span>Deep checks: Added later, only after you prove you own the domain.</span>
              </li>
            </ol>
          </article>
        </div>

        {/* Pricing Notes */}
        <div className="pricing-notes">
          <div className="note-box">
            <Icon name="shield" />
            <div>
              <strong>What counts as a scan:</strong> A scan is a fresh visit to your site. Re-viewing a result from the last 10 minutes does not count.
            </div>
          </div>
          <div className="note-box">
            <Icon name="shield" />
            <div>
              <strong>Fair use:</strong> Lifetime means the life of the product, with fair-use limits. Need more companion messages? Bring your own Gemini key (coming soon).
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
