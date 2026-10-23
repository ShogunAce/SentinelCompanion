import { Link } from 'react-router-dom';
import { Icon } from './components';
import { UserHeaderMenu } from './UserHeaderMenu';

export function PrivacyPage() {
  const openCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent('sentinel:open-cookie-preferences'));
  };

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
          <Link to="/privacy" style={{ fontWeight: 600, color: 'var(--blue)' }}>Privacy</Link>
          <Link to="/terms">Terms</Link>
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
              href="/assets/aistudio/Sentinel-privacy_0e5aae6a.pdf"
              download="Sentinel-Privacy-Policy.pdf"
              className="button small secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>📄</span>
              <span>Download Official Signed PDF</span>
            </a>
          </div>

          <div style={{ maxWidth: '860px', margin: '0 auto', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '16px', padding: '48px 40px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
            <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '24px', marginBottom: '32px' }}>
              <span className="section-kicker" style={{ display: 'block', marginBottom: '8px' }}>LEGAL COMPLIANCE &amp; DATA PROTECTION</span>
              <h1 style={{ fontSize: '32px', fontWeight: 650, color: 'var(--ink)', marginBottom: '12px' }}>
                Sentinel Privacy Policy
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
                <strong>Effective Date:</strong> October 2026 &bull; <strong>Operator:</strong> Cole Slay (dba Sentinel), 13565 Howling Coyote Ave, Las Vegas, NV 89138 &bull; <strong>Contact:</strong> coleslaysolutions@gmail.com
              </p>
            </div>

            {/* Quick Actions Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px 22px', marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block' }}>Your Privacy Controls</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Sentinel complies with GDPR (EU/UK), CCPA/CPRA (California), and global data privacy mandates.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#1e293b', cursor: 'pointer' }}
                >
                  🍪 Cookie Preferences
                </button>
                <Link
                  to="/workspace"
                  style={{ background: '#1f3bd6', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}
                >
                  Account Data Portal →
                </Link>
              </div>
            </div>

            {/* Policy Sections */}
            <div className="legal-article" style={{ fontSize: '14.5px', lineHeight: 1.75, color: '#334155' }}>
              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>1. Introduction &amp; Commitment to Privacy</h2>
                <p>
                  Sentinel (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), operated by Cole Slay, is dedicated to protecting the privacy and security of our users and their vibecoded web applications. This Privacy Policy outlines the specific categories of data we collect, how we sanitize and inspect public web surfaces, our use of artificial intelligence (Google Gemini API), and your statutory rights under the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA/CPRA), and related privacy laws worldwide.
                </p>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>2. Data We Collect &amp; Process</h2>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Target URLs &amp; Public Endpoints:</strong> When you submit a domain for inspection, our scanner fetches only public-facing web responses (HTML, compiled JavaScript bundles, CSS stylesheets, and HTTP response headers).
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Account Information:</strong> If you create an account, we store your email address, display name, UID, created timestamp, and authentication method via Firebase Authentication.
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Scan Logs &amp; Reports:</strong> Discovered vulnerability findings, security scores, and tailored AI prompt fixes generated for your target domains.
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    <strong>Technical Telemetry:</strong> Anonymized scan duration, crawler latency, and polite request timings to prevent scanner downtime and eliminate false positives.
                  </li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>3. Passive, Polite &amp; Non-Intrusive Scanning Architecture</h2>
                <p>
                  Sentinel adheres strictly to a zero-fuzzing, passive observation architecture:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li>We never perform SQL injection fuzzing, DDoS, brute-force credential stuffing, or destructive attacks.</li>
                  <li>Our scanner strictly respects <code>robots.txt</code> crawl-delay and disallow directives.</li>
                  <li>We identify our scanner via an honest User-Agent header (<code>Sentinel-Security-Companion/1.0</code>).</li>
                  <li>Target requests are rate-limited to avoid degrading server performance on your hosting infrastructure.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>4. Automatic Redaction &amp; Secret Hygiene</h2>
                <p>
                  To protect your sensitive credentials, our ingestion pipeline runs automated redaction rules before any data is sent to AI models or written to storage. We automatically strip:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li>Authorization bearer tokens, session IDs, and authentication cookies.</li>
                  <li>Production database passwords and private API secret keys.</li>
                  <li>Personal identifiable information (PII) including social security numbers and payment card data.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>5. Third-Party Artificial Intelligence (Google Gemini API)</h2>
                <p>
                  Sentinel utilizes the Google Gemini API to translate complex vulnerability signatures into plain-English explanations and tailored AI code-fix prompts:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li>All prompts are sanitized through our server-side proxy routes; customer API keys are never exposed in browser clients.</li>
                  <li>Under Google Cloud AI customer data commitments, customer prompt inputs and responses are not used to train or improve foundational models.</li>
                  <li>Only the relevant finding excerpt and security recommendation instructions are passed to Gemini.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>6. Data Retention, 15-Day Grace Period &amp; 45-Day Hard Purge</h2>
                <p>
                  We believe users should own their security data and have total control over retention:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li><strong>Active Accounts:</strong> Scan histories and fix prompts are retained while your account remains active to provide longitudinal security tracking.</li>
                  <li><strong>15-Day Cancellation Grace Period:</strong> When you request account or data deletion, your account is marked as <em>pending deletion</em>. You have a full 15 days to change your mind and cancel the deletion request from your dashboard.</li>
                  <li><strong>45-Day Hard Permanent Purge:</strong> Once the 15-day grace period concludes, Sentinel permanently purges all profile data, scan records, reports, and backup caches within 45 days. Deletion is irreversible once executed.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>7. Statutory Privacy Rights (GDPR &amp; CCPA/CPRA)</h2>
                <p>
                  Regardless of your geographical location, Sentinel extends full statutory privacy rights to all users:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li><strong>Right to Access &amp; Portability (GDPR Art. 20):</strong> Export a machine-readable JSON archive of all personal data, reports, and activity directly from the Privacy &amp; Data portal.</li>
                  <li><strong>Right to Erasure (GDPR Art. 17):</strong> Request complete deletion of your account and associated scan history at any time.</li>
                  <li><strong>Right to Rectification:</strong> Update your profile name or credentials anytime in your settings.</li>
                  <li><strong>No Sale of Data:</strong> Sentinel does not sell, rent, or trade your personal data or scan reports to third-party data brokers or advertisers.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>8. Cookies &amp; Local Storage Compliance</h2>
                <p>
                  We utilize cookies and browser storage in compliance with the EU ePrivacy Directive:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li><strong>Essential Cookies:</strong> Required for Firebase session tokens, CSRF protection, and rate limiting. Always active.</li>
                  <li><strong>Performance Analytics (Optional):</strong> Measures polite scanner latency. You may disable this at any time.</li>
                  <li><strong>Companion Personalization (Optional):</strong> Remembers your preferred AI code editor (Cursor, Bolt, Lovable, v0) and mascot position.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>9. Security Hardening &amp; Threat Defense</h2>
                <p>
                  Sentinel implements defense-in-depth protections across its own software:
                </p>
                <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                  <li><strong>IDOR Protection:</strong> Firestore Security Rules enforce strict UID matching on all reads, updates, and deletes, preventing unauthorized cross-tenant data access.</li>
                  <li><strong>Session TTL Enforcement:</strong> Active session tokens enforce inactivity timeouts (4 hours) and total session limits to prevent perpetual logins on shared terminals.</li>
                  <li><strong>Admin Isolation:</strong> Administrative command routes verify authenticated admin claims; unauthenticated or standard users receive standard HTTP 404 responses.</li>
                  <li><strong>Encryption:</strong> All network traffic is encrypted via TLS 1.3 in transit and AES-256 at rest.</li>
                </ul>
              </section>

              <section style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 650, color: '#0f172a', marginBottom: '12px' }}>10. Contacting Us &amp; Inquiries</h2>
                <p>
                  For any questions regarding this Privacy Policy, data subject access requests, or security inquiries, please contact:
                </p>
                <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '12px' }}>
                  <strong>Cole Slay — Sentinel Security Operations</strong><br />
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
