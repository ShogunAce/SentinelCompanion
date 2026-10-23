import { Link } from 'react-router-dom';
import { Icon } from './components';
import { UserHeaderMenu } from './UserHeaderMenu';

export function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      {/* Sticky Header */}
      <header className="container public-header">
        <Link to="/" className="brand">
          <Icon name="shield" />
          <span>Sentinel</span>
          <span className="brand-dot">.</span>
        </Link>
        <nav className="desktop-nav">
          <Link to="/">Home</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms" style={{ fontWeight: 600, color: 'var(--blue)' }}>Terms</Link>
          <UserHeaderMenu />
          <Link to="/workspace" className="header-workspace-link">Go to Workspace →</Link>
        </nav>
      </header>

      {/* Main Content */}
      <main id="main-content" style={{ flex: 1, paddingBottom: '80px' }}>
        <div className="container" style={{ paddingTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
            <Link to="/" className="back-link">
              <Icon name="arrow" />
              <span>Back to Home</span>
            </Link>

            {/* Download Official PDF Button */}
            <a
              href="/assets/aistudio/Sentinel-ToS_6e45ad51.pdf"
              download="Sentinel-Terms-of-Service.pdf"
              className="button small secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>📄</span>
              <span>Download Official Signed PDF</span>
            </a>
          </div>

          <div style={{ maxWidth: '860px', margin: '0 auto', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '24px', marginBottom: '32px' }}>
              <span className="section-kicker" style={{ display: 'block', marginBottom: '8px' }}>BINDING LEGAL AGREEMENT</span>
              <h1 style={{ fontSize: '32px', fontWeight: 650, color: 'var(--ink)', marginBottom: '12px' }}>
                Sentinel Terms of Service
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                <strong>Effective Date:</strong> October 2026 &bull; <strong>Service Provider:</strong> Cole Slay (dba Sentinel), 13565 Howling Coyote Ave, Las Vegas, NV 89138 &bull; <strong>Contact:</strong> coleslaysolutions@gmail.com
              </p>
            </div>

            {/* Quick Summary Banner */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 22px', marginBottom: '36px' }}>
              <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>
                Summary of Our Service Model
              </strong>
              <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                Sentinel provides non-intrusive, passive reconnaissance and tailored AI fix recommendations for vibecoded web applications. By submitting a domain or using the workspace, you confirm you own or have explicit authorization to scan that domain. We never conduct denial-of-service attacks or intrusive vulnerability exploitation.
              </p>
            </div>

            {/* Terms Sections */}
            <div className="legal-article" style={{ fontSize: '14.5px', lineHeight: 1.75, color: '#334155' }}>
              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>1. Acceptance of Terms</h2>
                <p>
                  These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Sentinel website, APIs, scanning services, and companion tooling operated by Cole Slay. By accessing our services, submitting a URL for inspection, or creating an account, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, do not use Sentinel.
                </p>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>2. Scope of Service &amp; Companion Tooling</h2>
                <p>
                  Sentinel is a cybersecurity companion designed specifically for modern AI code builders (e.g. Cursor, Bolt.new, Lovable, v0, Replit). The service performs passive surface audits, inspects HTTP response headers, flags common security misconfigurations, and translates discovered risks into plain English and prompt-ready fixes for AI editors.
                </p>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>3. Authorization &amp; User Representations</h2>
                <p>
                  You expressly represent and warrant that:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li>You own the web application or domain you submit for scanning, OR you have received explicit written authorization from the owner to perform security reconnaissance.</li>
                  <li>You will not submit domains belonging to third parties without permission, government or military infrastructure, critical healthcare systems, or financial institutions.</li>
                  <li>You will not use scan outputs, vulnerability signatures, or AI fix prompts to conduct malicious attacks or exploit vulnerabilities against any person or entity.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>4. Non-Intrusive Scanning Guarantee</h2>
                <p>
                  Sentinel adheres to an ethical, passive inspection guarantee:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li>Our scanner does not inject destructive payloads, perform automated fuzzing, or execute denial-of-service operations.</li>
                  <li>Scanning is limited to publicly visible HTML responses, published script assets, and standard HTTP headers.</li>
                  <li>Our scanner honors <code>robots.txt</code> crawl directives and respects standard web polite crawl rate limits.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>5. User Accounts &amp; Session Security</h2>
                <p>
                  When creating an account, you agree to provide accurate information and maintain the security of your credentials:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li><strong>Password Complexity:</strong> Accounts created with email/password must meet complexity rules (minimum 8 characters, uppercase, lowercase, numbers, and symbols).</li>
                  <li><strong>Session TTL:</strong> To prevent unauthorized access on shared devices, active sessions expire after 4 hours of inactivity or 24 hours of total session duration.</li>
                  <li><strong>Two-Factor Authentication (2FA):</strong> 2FA features will be enabled in upcoming releases to provide hardware-backed and TOTP account hardening.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>6. Subscription Plans, Billing &amp; Fair Use</h2>
                <p>
                  Sentinel offers Free, Pro, and Lifetime founding access tiers:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li><strong>Free Plan:</strong> Includes 1 connected app, 5 monthly fresh scans, and 15 companion messages per month.</li>
                  <li><strong>Pro Plan:</strong> Billed monthly or annually. Includes multiple connected apps, expanded scan allowances, weekly automated rescans, and upcoming agentic features.</li>
                  <li><strong>Lifetime Founding Tier:</strong> Capped at 100 founding seats. Provides lifetime access for the duration of the Sentinel product, subject to reasonable fair-use limits.</li>
                  <li><strong>Agentic Features:</strong> Advanced autonomous remediation and multi-file code patching capabilities are currently under development and will be released to Pro and Lifetime members.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>7. Nature of AI Advice &amp; Fix Prompts</h2>
                <p>
                  Fix prompts and risk explanations generated by Sentinel and the Google Gemini API are advisory educational recommendations. Because AI coding assistants may generate code with unexpected behavior, you are solely responsible for reviewing, testing, and verifying any code before deploying it to production systems. Sentinel does not guarantee that applying a prompt will completely resolve all vulnerabilities.
                </p>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>8. Data Deletion, 15-Day Grace Period &amp; 45-Day Retention</h2>
                <p>
                  You may request account and data deletion at any time through the Privacy &amp; Data portal:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li>Upon submitting a deletion request, your account enters a <strong>15-day cancellation grace period</strong>, during which you may restore your account.</li>
                  <li>After 15 days, permanent data erasure begins. All personal records, scan reports, and database records are permanently purged within <strong>45 days</strong>.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>9. Disclaimer of Warranties &amp; Limitation of Liability</h2>
                <p>
                  SENTINEL IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS. PASSIVE RECONNAISSANCE DOES NOT CONSTITUTE A FORMAL PENETRATION TEST OR COMPLIANCE CERTIFICATION (SOC 2, ISO 27001, OR PCI-DSS). TO THE MAXIMUM EXTENT PERMITTED BY LAW, COLE SLAY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, INCLUDING LOSS OF DATA, REPUTATION, OR REVENUE. TOTAL LIABILITY SHALL BE LIMITED TO THE AMOUNT PAID BY YOU TO SENTINEL IN THE PRECEDING TWELVE (12) MONTHS OR $100, WHICHEVER IS GREATER.
                </p>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>10. Governing Law &amp; Jurisdiction</h2>
                <p>
                  These Terms are governed by and construed under the laws of the State of Nevada, United States, without regard to conflict of law principles. Any legal action or proceeding arising under these Terms shall be instituted exclusively in the state or federal courts situated in Clark County, Nevada.
                </p>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>11. Contact &amp; Legal Notices</h2>
                <p>
                  For formal legal notices or questions regarding these Terms, please contact:
                </p>
                <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '12px' }}>
                  <strong>Cole Slay — Sentinel Operations</strong><br />
                  13565 Howling Coyote Ave, Las Vegas, NV 89138<br />
                  Email: <a href="mailto:coleslaysolutions@gmail.com" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>coleslaysolutions@gmail.com</a>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

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
      </footer>
    </div>
  );
}
