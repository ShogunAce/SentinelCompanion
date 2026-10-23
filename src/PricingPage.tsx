import { Link } from 'react-router-dom';
import { PricingSection } from './PricingSection';
import { Icon } from './components';
import { WaitlistModal } from './WaitlistModal';
import { UserHeaderMenu } from './UserHeaderMenu';

export function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* Header */}
      <header className="container public-header">
        <Link to="/" className="brand">
          <Icon name="shield" />
          <span>Sentinel</span>
          <span className="brand-dot">.</span>
        </Link>
        <nav className="desktop-nav">
          <Link to="/">Home</Link>
          <Link to="/pricing" style={{ fontWeight: 600, color: 'var(--blue)' }}>Pricing</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
          <UserHeaderMenu />
          <Link to="/workspace" className="header-workspace-link">Go to Workspace →</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main-content" style={{ flex: 1 }}>
        <div className="container" style={{ paddingTop: '40px' }}>
          <Link to="/" className="back-link">
            <Icon name="arrow" />
            <span>Back to Home</span>
          </Link>
        </div>

        <PricingSection />

        {/* Pricing FAQ Section */}
        <section className="container section faq-section" style={{ borderTop: '1px solid var(--line)', marginTop: '40px' }}>
          <div className="section-intro">
            <div className="section-kicker">PRICING FAQ</div>
            <h2>Clear answers about plans and limits</h2>
            <p>Everything you need to know about fresh scans, companion allowances, and fair-use terms.</p>
          </div>

          <div className="faq-list">
            <details>
              <summary>
                <span>What happens when I run out of scans?</span>
                <span className="disclosure-mark">+</span>
              </summary>
              <p>
                When you reach your monthly scan limit, your existing report remains completely accessible. You can continue inspecting previously discovered findings, copying AI fix prompts, and conversing with the companion. Your allowance resets automatically on the 1st of next month.
              </p>
            </details>

            <details>
              <summary>
                <span>Why is there a limit on companion messages?</span>
                <span className="disclosure-mark">+</span>
              </summary>
              <p>
                Each companion message triggers a real-time Gemini AI API call that costs real computing money. The Free plan keeps a generous 15 message allowance so every builder gets AI guidance without unexpected surprise fees.
              </p>
            </details>

            <details>
              <summary>
                <span>Is Lifetime really lifetime?</span>
                <span className="disclosure-mark">+</span>
              </summary>
              <p>
                Lifetime means the life of the Sentinel product, backed by a strict 100 seat founding cap and fair-use limits. If you ever need expanded companion usage, you can bring your own Gemini API key (coming soon).
              </p>
            </details>

            <details>
              <summary>
                <span>Can I upgrade or switch plans later?</span>
                <span className="disclosure-mark">+</span>
              </summary>
              <p>
                Yes. You can manage your tier inside the Workspace dashboard under Plan & Usage. Founding spots for Pro and Lifetime are opening soon.
              </p>
            </details>
          </div>
        </section>
      </main>
      <WaitlistModal />

      {/* Footer */}
      <footer className="footer container">
        <div className="brand">
          <Icon name="shield" />
          <span>Sentinel</span>
          <span className="brand-dot">.</span>
        </div>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
          <Link to="/workspace">Workspace</Link>
        </nav>
        <p className="subtle">Sentinel Digital Security Companion</p>
      </footer>
    </div>
  );
}
