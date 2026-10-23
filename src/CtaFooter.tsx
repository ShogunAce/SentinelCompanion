import { Link, useNavigate } from "react-router-dom";
import { Accent, GLOBE_IMG, ShieldMark, Words } from "./landingBits";

// Closing call to action over the dotted globe, with a soft liquid-glass footer.
export const CtaFooter = () => {
  const navigate = useNavigate();

  return (
    <section className="lp-section end band" id="end">
      <div className="end-glow" aria-hidden="true" />
      <div className="globe" aria-hidden="true">
        <img src={GLOBE_IMG} alt="" loading="lazy" />
      </div>
      <div className="wrap">
        <div className="cta">
          <img className="cta-robot" src="/sentinel-bot-512.webp" alt="" loading="lazy" />
          <h2 className="h2" data-words><Words>Your next vibecoded app starts</Words> <Accent>securely.</Accent></h2>
          <p className="lede" data-reveal>
            Audit public surfaces, client assets, and leaked credentials in seconds. Catch cybersecurity flaws early and get targeted fix prompts for your AI builder.
          </p>
          <div className="cta-actions" data-reveal>
            <button className="btn btn-navy" type="button" onClick={() => navigate('/workspace')}>Open workspace ↗</button>
            <button className="btn btn-glass" type="button" onClick={() => navigate('/pricing')}>View pricing ↗</button>
          </div>
        </div>

        <footer className="lg-footer" data-reveal>
          <div className="f-grid">
            <div className="f-brand">
              <Link className="lp-brand" to="/" aria-label="Sentinel home">
                <ShieldMark />
                <span>Sentinel<span className="dot">.</span></span>
              </Link>
              <p>Your digital security companion for vibecoded apps. Find the flaw, understand it, prompt the fix.</p>
            </div>
            <div className="f-col"><h4>Product</h4><a href="#how-it-works">How it works</a><a href="#report">Sample report</a><Link to="/pricing">Pricing</Link><a href="#coverage">Coverage</a></div>
            <div className="f-col"><h4>Workspace</h4><Link to="/workspace">Open workspace</Link><Link to="/workspace/new-scan">New scan</Link><Link to="/workspace/reports">Reports</Link></div>
            <div className="f-col"><h4>Company</h4><Link to="/contact">Contact</Link><a href="#faq">FAQ</a><Link to="/workspace/coverage">Scope</Link></div>
            <div className="f-col">
              <h4>Privacy &amp; Trust</h4>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('sentinel:open-cookie-preferences'))}
                style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', textAlign: 'left' }}
              >
                Cookie Preferences
              </button>
              <Link to="/workspace">Account Data Portal</Link>
              <a href="/assets/aistudio/Sentinel-privacy_0e5aae6a.pdf" download="Sentinel-Privacy-Policy.pdf">Privacy Policy (PDF)</a>
              <a href="/assets/aistudio/Sentinel-ToS_6e45ad51.pdf" download="Sentinel-Terms-of-Service.pdf">Terms of Service (PDF)</a>
            </div>
          </div>
          <div className="f-bottom">
            <span>&copy; 2026 Sentinel. Digital cybersecurity companion for vibecoded apps.</span>
            <span className="mono">Passive · Polite · Plain English · Zero-Trust</span>
          </div>
        </footer>
      </div>
    </section>
  );
};

export default CtaFooter;
