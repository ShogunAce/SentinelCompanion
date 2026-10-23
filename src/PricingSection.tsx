import { useState } from 'react';
import { PLANS, SEATS_CLAIMED } from './plans';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { Accent, Words } from './landingBits';

// Rendered inside the landing page (as a colour band) and on /pricing (standalone).
// The section carries the .lp scope itself so it is styled on both.
export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const handleFreeClick = () => {
    if (user) {
      navigate('/workspace/new-scan');
    } else {
      openAuthModal('signup');
    }
  };

  return (
    <section id="pricing" className="lp lp-section pricing band band-peri">
      <div className="wrap">
        <div className="center-head">
          <p className="kicker center" data-reveal>Honest pricing</p>
          <h2 className="h2" data-words><Words>Pricing that matches what the companion</Words> <Accent>actually costs.</Accent></h2>
          <p className="lede" data-reveal>
            Every scan and AI message requires real computing resources. Our free plan covers early development needs, while founding plans support growing apps.
          </p>
          <div className="toggle glass" role="group" aria-label="Billing" data-reveal>
            <button type="button" aria-pressed={billingCycle === 'monthly'} onClick={() => setBillingCycle('monthly')}>Monthly billing</button>
            <button type="button" aria-pressed={billingCycle === 'annual'} onClick={() => setBillingCycle('annual')}>Annual billing (save $45)</button>
          </div>
        </div>

        <div className="plans">
          <article className="plan" data-reveal>
            <div className="plan-tags"><span className="ptag">Available today</span></div>
            <h3>{PLANS.free.name}</h3>
            <div className="price"><b>$0</b><span>/ month</span></div>
            <p>For individual builders and early prototypes testing their security baseline.</p>
            <button className="btn btn-glass" type="button" onClick={handleFreeClick}>Start free →</button>
            <ul className="feats">
              <li>{PLANS.free.apps} connected app</li>
              <li>{PLANS.free.scansPerMonth} fresh scans per month</li>
              <li>{PLANS.free.companionPerMonth} companion messages per month</li>
              <li>Latest report history</li>
              <li>Manual on-demand rescans</li>
              <li>Top 3 copy-paste fix prompts</li>
              <li className="off">No deep checks</li>
            </ul>
          </article>

          <article className="plan pro" data-reveal>
            <div className="plan-tags"><span className="ptag hot">Most builders pick this</span><span className="ptag soft">Opening soon</span></div>
            <h3>{PLANS.pro.name}</h3>
            <div className="price">
              {billingCycle === 'monthly'
                ? <><b>${PLANS.pro.price}</b><span>/ month</span></>
                : <><b>${PLANS.pro.annualPrice}</b><span>/ year</span></>}
            </div>
            <p>
              {billingCycle === 'annual'
                ? 'Save $45 a year when billed annually.'
                : 'Full coverage for active builders running multiple vibecoded projects.'}
            </p>
            <button className="btn btn-navy" type="button" onClick={() => window.open(PLANS.pro.stripePaymentLink, '_blank')}>Subscribe Pro ($15/mo)</button>
            <ul className="feats">
              <li>{PLANS.pro.apps} connected apps</li>
              <li>{PLANS.pro.scansPerMonth} fresh scans per month</li>
              <li>{PLANS.pro.companionPerMonth} companion messages per month</li>
              <li>Full report history</li>
              <li>Weekly automated rescan</li>
              <li>All copy-paste fix prompts</li>
              <li>Deep checks, added later after you prove you own the domain</li>
              <li>Agentic features coming soon</li>
            </ul>
          </article>

          <article className="plan" data-reveal>
            <div className="plan-tags"><span className="ptag">{PLANS.lifetime.seatCap} founding seats</span><span className="ptag soft">Opening soon</span></div>
            <h3>{PLANS.lifetime.name}</h3>
            <div className="price"><b>${PLANS.lifetime.price}</b><span>one-time</span></div>
            <p>One payment for founding supporters. Seats claimed: {SEATS_CLAIMED} of {PLANS.lifetime.seatCap}.</p>
            <button className="btn btn-glass" type="button" onClick={() => window.open(PLANS.lifetime.stripePaymentLink, '_blank')}>Buy Lifetime ($149)</button>
            <ul className="feats">
              <li>{PLANS.lifetime.apps} connected apps</li>
              <li>{PLANS.lifetime.scansPerMonth} fresh scans per month</li>
              <li>{PLANS.lifetime.companionPerMonth} companion messages per month</li>
              <li>Full report history</li>
              <li>Weekly automated rescan</li>
              <li>All copy-paste fix prompts</li>
              <li>Deep checks, added later after you prove you own the domain</li>
              <li>Agentic features coming soon</li>
            </ul>
          </article>
        </div>

        <div className="fine" data-reveal>
          <p><strong>What counts as a scan:</strong> a fresh visit to your site. Re-viewing a result from the last 10 minutes does not count.</p>
          <p><strong>Fair use:</strong> Lifetime means the life of the product, with fair-use limits. Need more companion messages? Bring your own Gemini key (coming soon).</p>
        </div>
      </div>
    </section>
  );
}
