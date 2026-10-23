import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { UrlFormProps } from './components';
import { UserHeaderMenu } from './UserHeaderMenu';
import Hero from './Hero';
import { PricingSection } from './PricingSection';
import { FaqSection } from './FaqSection';
import { CtaFooter } from './CtaFooter';
import { WaitlistModal } from './WaitlistModal';
import { SampleReport } from './SampleReport';
import { Accent, ShieldMark, Words } from './landingBits';
import { useLandingMotion } from './useLandingMotion';
import './landing.css';

const publicLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing', isRoute: true },
  { href: '#coverage', label: 'Coverage' },
  { href: '#faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact', isRoute: true },
];

function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}`}>
      <div className="wrap">
        <Link className="lp-brand" to="/" aria-label="Sentinel home">
          <ShieldMark />
          <span>Sentinel<span className="dot">.</span></span>
        </Link>
        <nav className="nav-links" aria-label="Website">
          {publicLinks.map((l) =>
            l.isRoute ? (
              <Link key={l.href} to={l.href}>{l.label}</Link>
            ) : (
              <a key={l.href} href={l.href}>{l.label}</a>
            )
          )}
        </nav>
        <div className="nav-actions">
          <UserHeaderMenu />
          <Link className="nav-ws" to="/workspace">Open workspace <span aria-hidden="true">→</span></Link>
          <button className="menu-btn glass" type="button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
        <nav className={`mobile-menu${open ? ' open' : ''}`} aria-label="Mobile website" onClick={(e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); }}>
          {publicLinks.map((l) =>
            l.isRoute ? (
              <Link key={l.href} to={l.href}>{l.label} <span>→</span></Link>
            ) : (
              <a key={l.href} href={l.href}>{l.label} <span>→</span></a>
            )
          )}
          <Link to="/workspace">Open workspace <span>→</span></Link>
        </nav>
      </div>
      <div className="progress" aria-hidden="true"><i data-progress /></div>
    </header>
  );
}

/* ---------------- How it works: four square feature cards ---------------- */

const CARDS = [
  {
    n: '01', role: 'The Observer', title: <em>Recon</em>, desc: 'Audit public surfaces, client assets, and response headers for coding flaws.',
    points: ['Reads your public pages, scripts, and compiled bundles.', 'Checks response headers and security flags.', 'Passive and polite: respects robots.txt, never fuzzes.'],
    cta: { label: 'Start a scan', to: '#hero', dark: true }, panel: 'recon',
  },
  {
    n: '02', role: 'The Risk Explainer', title: 'Translator', desc: 'Translate security vulnerabilities into clear, plain-English impact statements.',
    points: ['Ranked by severity: critical, warning, info.', 'What it is, why it matters, who it affects.', 'No cybersecurity degree required.'],
    cta: { label: 'Read a sample finding', to: '#report', dark: false }, panel: 'translate',
  },
  {
    n: '03', role: 'The Prompt Fixer', title: 'Fix Doctor', desc: 'Generate tailored fix prompts to paste straight back into your AI editor.',
    points: ['Prompts written for your exact finding.', 'Paste into any AI builder and keep moving.', 'Ask the companion follow-ups in plain English.'],
    cta: { label: 'Copy a fix prompt', to: '#why', dark: true }, panel: 'fix',
  },
  {
    n: '04', role: 'The Re-checker', title: 'Verify', desc: 'Rescan after every fix and confirm each flaw is truly closed, not just hidden.',
    points: ['On-demand rescans on every plan.', 'Weekly automated rescans on Pro.', 'Full report history to track your progress.'],
    cta: { label: 'Compare plans', to: '#pricing', dark: false }, panel: 'verify',
  },
] as const;

function Panel({ kind }: { kind: string }) {
  if (kind === 'recon') return (
    <svg viewBox="0 0 680 440" fill="none" aria-hidden="true">
      <defs>
        <marker id="lp-arw" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M1 1 8 5 1 9" fill="none" stroke="#1F3BD6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></marker>
        <linearGradient id="lp-lg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E58FA8" /><stop offset=".5" stopColor="#1F3BD6" /><stop offset="1" stopColor="#A48BE0" /></linearGradient>
        <radialGradient id="lp-core" cx=".5" cy=".4" r=".6"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#EEF0FB" /></radialGradient>
      </defs>
      <g stroke="rgba(20,20,20,.16)" strokeDasharray="3 6"><path d="M340 220 340 104" /><path d="M340 220 528 220" /><path d="M340 220 340 336" /><path d="M340 220 152 220" /></g>
      <g stroke="url(#lp-lg1)" strokeWidth="1.6" strokeLinecap="round" markerEnd="url(#lp-arw)">
        <path className="draw" pathLength={1} d="M392 78 C 460 86, 505 130, 518 194" />
        <path className="draw d2" pathLength={1} d="M518 246 C 505 310, 460 354, 392 362" />
        <path className="draw d3" pathLength={1} d="M288 362 C 220 354, 175 310, 162 246" />
        <path className="draw d4" pathLength={1} d="M162 194 C 175 130, 220 86, 288 78" />
      </g>
      <circle className="spin" cx="340" cy="220" r="62" stroke="rgba(31,59,214,.28)" strokeDasharray="2 7" />
      <circle cx="340" cy="220" r="38" fill="url(#lp-core)" stroke="rgba(31,59,214,.3)" />
      <path d="M340 202 354 207v10c0 9-8 14-14 17-6-3-14-8-14-17v-10z" stroke="#1F3BD6" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M334.5 218.5 345.5 229.5M345.5 218.5 334.5 229.5" stroke="#E58FA8" strokeWidth="1.6" strokeLinecap="round" />
      <g fontFamily="JetBrains Mono, monospace" fontSize="12.5" letterSpacing="1.8">
        {([[340, 78, 112, '#1F3BD6', 'PAGES'], [560, 220, 124, '#A48BE0', 'SCRIPTS'], [340, 362, 124, '#E58FA8', 'HEADERS'], [120, 220, 124, '#8FD6E8', 'SECRETS']] as const).map(([x, y, w, c, t]) => (
          <g key={t} transform={`translate(${x} ${y})`}>
            <rect x={-w / 2} y="-18" width={w} height="36" rx="18" fill="#fff" stroke="rgba(20,20,20,.12)" />
            <circle cx={-w / 2 + 20} cy="0" r="4" fill={c} /><text x={-w / 2 + 32} y="4.5" fill="#141414">{t}</text>
          </g>
        ))}
      </g>
      <g className="fade-in" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="rgba(20,20,20,.45)">
        <text x="340" y="40" textAnchor="middle">$ sentinel recon --pages</text>
        <text x="640" y="268" textAnchor="end">$ recon --scripts</text>
        <text x="340" y="410" textAnchor="middle">$ sentinel recon --headers</text>
        <text x="40" y="268">$ recon --secrets</text>
      </g>
    </svg>
  );
  if (kind === 'translate') return (
    <div className="tp" aria-hidden="true">
      <div className="tp-picker"><span className="faint">finding /</span><span>open-database-rule</span><span className="sev">CRITICAL</span><span className="chev">▾</span></div>
      <pre className="tp-code">{'match /users/{userId} {\n  '}<b>allow read, write: if true;</b>{'\n}'}</pre>
      <div className="tp-bar"><span>TRANSLATE</span><i>→</i></div>
      <ul className="tp-results">
        <li><b>What</b>Anyone on the internet can read and edit every user record.</li>
        <li><b>Why</b>Emails, profiles and private data are exposed.</li>
        <li><b>Who</b>Every person who signed up for your app.</li>
      </ul>
    </div>
  );
  if (kind === 'fix') {
    const pts = 'M40 286 58 282 74 288 92 274 108 278 126 262 142 268 160 250 176 255 194 236 210 242 228 222 244 228 262 206 278 212 296 190 312 196 330 172 346 180 364 152 380 160 398 132 414 142 432 112 448 120 466 94 482 100 496 76';
    return (
      <svg viewBox="0 0 532 360" fill="none" aria-hidden="true">
        <defs>
          <pattern id="lp-fine" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M14 0H0V14" stroke="rgba(20,20,20,.05)" /></pattern>
          <linearGradient id="lp-lg2" x1="0" x2="1"><stop offset="0" stopColor="#E58FA8" /><stop offset=".45" stopColor="#1F3BD6" /><stop offset="1" stopColor="#A48BE0" /></linearGradient>
          <linearGradient id="lp-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(31,59,214,.16)" /><stop offset="1" stopColor="rgba(31,59,214,0)" /></linearGradient>
        </defs>
        <rect x="40" y="56" width="456" height="244" fill="url(#lp-fine)" />
        <g stroke="rgba(20,20,20,.1)"><path d="M40 300H496" /><path d="M40 56V300" /><path d="M40 178H496" strokeDasharray="3 5" /></g>
        <path className="fade-in" fill="url(#lp-area)" d={`${pts}V300H40Z`} />
        <path className="draw" pathLength={1} stroke="url(#lp-lg2)" strokeWidth="2.2" strokeLinejoin="round" d={pts} />
        <g className="fade-in">
          <circle cx="262" cy="206" r="5" fill="#fff" stroke="#1F3BD6" strokeWidth="1.6" />
          <rect x="196" y="160" width="132" height="28" rx="14" fill="#fff" stroke="rgba(20,20,20,.12)" />
          <text x="262" y="178.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10.5" letterSpacing="1" fill="#141414">⧉ prompt pasted</text>
          <circle cx="496" cy="76" r="12" fill="rgba(31,59,214,.14)" /><circle cx="496" cy="76" r="5" fill="#1F3BD6" />
        </g>
        <g fontFamily="JetBrains Mono, monospace" fontSize="10.5" letterSpacing="1.4" fill="rgba(20,20,20,.45)">
          <text x="40" y="34" fill="#141414">SECURITY SCORE</text>
          <text x="496" y="34" textAnchor="end">6 PROMPTS APPLIED</text>
          {[40, 131, 222, 313, 404].map((x, i) => <text key={x} x={x} y="324">FIX {i + 1}</text>)}
          <text x="496" y="324" textAnchor="end">FIX 6</text>
        </g>
        <g fontFamily="Instrument Serif, Georgia, serif" fontStyle="italic" fontSize="22">
          <text x="26" y="292" textAnchor="end" fill="#C0394F">D</text>
          <text x="26" y="84" textAnchor="end" fill="#1F3BD6">A</text>
        </g>
      </svg>
    );
  }
  return (
    <div className="vp" aria-hidden="true">
      <div className="vp-top"><span>rescans / <strong>your-app.com</strong></span><span className="tag">↻ WEEKLY RESCAN</span></div>
      <div className="row"><i className="d" /><div className="t">Exposed service key<small>client bundle · main.4f2a.js</small></div><span className="s">RESOLVED</span></div>
      <div className="row"><i className="d" /><div className="t">Missing CSP header<small>response headers · /</small></div><span className="s">RESOLVED</span></div>
      <div className="row"><i className="d p" /><div className="t">Open /users database rule<small>database rules</small><div className="bar"><i /></div></div><span className="s p">RECHECKING</span></div>
      <div className="row"><i className="d q" /><div className="t">Unsafe CORS policy<small>api · /v1/*</small></div><span className="s q">QUEUED</span></div>
    </div>
  );
}

function HowItWorks() {
  const [shown, setShown] = useState<number | null>(null);
  return (
    <section className="lp-section how band band-how" id="how-it-works">
      <div className="wrap">
        <div className="how-head">
          <p className="kicker center" data-reveal>Your digital companion in action</p>
          <h2 className="h2" data-words><Words>From vibecoded app</Words><br /><Words>to</Words> <Accent>hardened software.</Accent></h2>
          <p className="lede" data-reveal>Four steps, one companion. Sentinel looks, explains, writes the fix, then checks that it held.</p>
          <div className="how-actions" data-reveal>
            <a className="mbtn dark" href="#hero">Scan your app <span aria-hidden="true">→</span></a>
            <a className="mbtn light" href="#report">See a sample report</a>
          </div>
        </div>
        <div className="bento">
          <div className="bento-grid">
            {CARDS.map((c, i) => (
              <article
                key={c.n}
                className={`card${shown === i ? ' show' : ''}`}
                data-reveal
                data-draw
                tabIndex={0}
                onClick={(e) => { if (!(e.target as HTMLElement).closest('a')) setShown((s) => (s === i ? null : i)); }}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); setShown((s) => (s === i ? null : i)); } }}
              >
                <div className="card-in">
                  <div className="panel"><Panel kind={c.panel} /></div>
                  <div className="copy">
                    <p className="label"><b>{c.n}</b> {c.role}</p>
                    <h3>{c.title}</h3>
                    <p className="desc">{c.desc}</p>
                    <ol className="points">{c.points.map((p, k) => <li key={p}><span>{(i + 1) * 10 + k + 1}</span>{p}</li>)}</ol>
                    <a className={`mbtn ${c.cta.dark ? 'dark' : 'light'}`} href={c.cta.to}>{c.cta.label}{c.cta.dark && <span aria-hidden="true"> →</span>}</a>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="bento-hint" data-reveal>Hover or tap a card for details</p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Why + key benefits: flip cards ---------------- */

const FIX_PROMPT = 'Move the service role key to a server-only env var, rotate it, and call the database from a backend route instead of the client.';
const FLIPS = [
  { n: '01', lab: 'Preemptive risk scouting', tags: ['API KEYS', 'CORS', 'HEADERS'], q: ['What is the', 'vulnerability?'], title: 'Preemptive Risks Scouting',
    body: 'Sentinel observes your public surface, client files, and response behaviour to uncover unusual patterns and outliers before attackers strike.', lead: 'What is the vulnerability?',
    snipK: 'Found in your bundle', snip: 'VITE_SERVICE_ROLE_KEY = "eyJhbGciOi••••••"' },
  { n: '02', lab: 'Defensive impact analysis', tags: ['PRIVACY', 'DATA LOSS', 'BYPASS'], q: ['Why is it a', 'security risk?'], title: 'Defensive Impact Analysis',
    body: 'Understand the real-world operational and privacy consequence of every leak, bypass, or misconfiguration without wading through jargon.', lead: 'Why is it a security risk?',
    snipK: 'In plain English', snip: 'Anyone holding this key can read, change, or delete every row in your database.' },
  { n: '03', lab: 'Instant reaction & remediation', tags: ['FIX PROMPT', 'COPY', 'PASTE'], q: ['How do I', 'fix it?'], title: 'Instant Reaction & Remediation',
    body: 'Copy Sentinel’s targeted fix prompt directly into your AI code builder (Cursor, Lovable, Bolt, v0) to resolve the flaw immediately.', lead: 'How do I fix it?',
    snipK: 'Fix prompt', snip: FIX_PROMPT, prompt: true },
];

function WhySection() {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState('COPY');
  const firstRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);

  const flip = (i: number) => {
    touched.current = true;
    setOpen((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  };

  // First time the cards come into view, card 01 peeks open once as a hint.
  useEffect(() => {
    const el = firstRef.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timers: number[] = [];
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      timers.push(window.setTimeout(() => {
        if (touched.current) return;
        setOpen((s) => new Set(s).add(0));
        timers.push(window.setTimeout(() => { if (!touched.current) setOpen((s) => { const n = new Set(s); n.delete(0); return n; }); }, 1500));
      }, 900));
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
  }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(FIX_PROMPT); setCopied('COPIED'); } catch { setCopied('SELECT'); }
    setTimeout(() => setCopied('COPY'), 1600);
  };

  return (
    <section className="lp-section lp-why band band-blush" id="why">
      <div className="wrap">
        <div className="why-top">
          <div>
            <p className="kicker" data-reveal>Built for the vibe coding era · Key benefits</p>
            <h2 className="h2" data-words><Words>Vibe coding is fast.</Words><br /><Words>Security flaws are</Words> <Accent>sneaky.</Accent></h2>
          </div>
          <div data-reveal>
            <p className="large">When you build apps by chatting with AI, functional UI appears in seconds, along with hidden cybersecurity blind spots.</p>
            <p className="lede">AI tools write functional code, but they do not automatically lock down your routes, protect your API keys, or enforce database rules. Sentinel is your digital companion that catches coding flaws early and translates them into clear explanations and instant fixes for your AI builder, no cybersecurity degree required.</p>
            <p className="sub-h">Flaws explained. <span>Fixes <em>ready to prompt.</em></span></p>
          </div>
        </div>
        <div className="flips">
          {FLIPS.map((f, i) => (
            <div
              key={f.n}
              ref={i === 0 ? firstRef : undefined}
              className={`flip${open.has(i) ? ' open' : ''}`}
              role="button"
              tabIndex={0}
              aria-pressed={open.has(i)}
              aria-label={`${f.lab}: ${f.lead} Flip for details`}
              data-reveal
              onClick={(e) => { if (!(e.target as HTMLElement).closest('.copy-btn')) flip(i); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(i); } }}
            >
              <div className="flip-inner">
                <div className="face front">
                  <div className="f-top"><span className="f-num">{f.n}</span><span className="f-lab">{f.lab}</span></div>
                  <div className="f-tags">{f.tags.map((t) => <span key={t} className="glass">{t}</span>)}</div>
                  <p className="f-q">{f.q[0]} <em>{f.q[1]}</em></p>
                  <div className="f-foot"><span>Flip to open</span><span className="flip-ic glass" aria-hidden="true">↻</span></div>
                </div>
                <div className="face back">
                  <h3>{f.title}</h3>
                  <p><strong>{f.lead}</strong> {f.body}</p>
                  {f.prompt ? (
                    <div className="snip prompt"><span className="k">{f.snipK}</span><span className="ptxt">{f.snip}</span><button className="copy-btn" type="button" onClick={copy}>{copied}</button></div>
                  ) : (
                    <div className="snip"><span className="k">{f.snipK}</span>{f.snip}</div>
                  )}
                  <div className="f-foot"><span>Flip back</span><span className="flip-ic glass" aria-hidden="true">↺</span></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="flips-hint" data-reveal>Tap a card to flip it open</p>
      </div>
    </section>
  );
}

/* ---------------- Sample report ---------------- */

function ReportSection() {
  const navigate = useNavigate();
  return (
    <section className="lp-section band band-white" id="report">
      <div className="wrap">
        <div className="report-head">
          <div>
            <p className="kicker" data-reveal>Clarity you can act on</p>
            <h2 className="h2" data-words><Words>A security report built for</Words> <Accent>AI builders.</Accent></h2>
          </div>
          <p className="lede" data-reveal>Open a finding, read it in plain English, copy the exact fix prompt, then flip <strong>Mark as fixed</strong> to watch your grade climb. Try it.</p>
        </div>
        <div data-reveal>
          <SampleReport onRunScan={() => navigate('/workspace/new-scan')} />
        </div>
        <div className="report-foot">
          <span>Sample data. Every finding, score and prompt matches what a real Sentinel scan returns.</span>
          <Link to="/workspace">Explore the workspace →</Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Coverage ---------------- */

function CoverageSection() {
  return (
    <section className="lp-section band band-white band-dots" id="coverage">
      <div className="wrap">
        <p className="kicker" data-reveal>Honest about the whole picture</p>
        <h2 className="h2" data-words><Words>What Sentinel can, and</Words> <Accent>cannot,</Accent> <Words>see.</Words></h2>
        <div className="cov-grid">
          <div className="cov" data-reveal>
            <div className="cov-ic glass"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></svg></div>
            <h3>Public-surface checks</h3>
            <p>Sentinel audits your app’s public surface, client scripts, and response headers for cybersecurity and coding flaws.</p>
            <ul><li>Exposed client assets and secrets</li><li>Client-side scripts and API endpoints</li><li>HTTP response headers and security flags</li></ul>
          </div>
          <div className="cov deep" data-reveal>
            <div className="cov-ic glass"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg></div>
            <h3>Checks that need deeper access</h3>
            <p>Full backend authentication behaviour, database rules, and private API routes require deeper access or scoped testing.</p>
            <ul><li>Backend authentication behaviour</li><li>Authorization and access controls</li><li>Database rules and RLS permissions</li></ul>
          </div>
        </div>
        <div className="cov-foot glass" data-reveal><strong>A public URL scan inspects open surface signals.</strong><span>Deeper backend protections need scoped verification.</span></div>
      </div>
    </section>
  );
}

/* ---------------- AI builders ticker ---------------- */

const LH = 'https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg@1.90.0/icons/';
const SI = 'https://cdn.jsdelivr.net/npm/simple-icons@15.3.0/icons/';
const BUILDERS: Array<[string, string, string, boolean?]> = [
  ['Google AI Studio', 'AI studio', LH + 'aistudio.svg'],
  ['Cursor', 'AI code editor', LH + 'cursor.svg'],
  ['Lovable', 'App builder', LH + 'lovable.svg'],
  ['Bolt.new', 'App builder', SI + 'stackblitz.svg'],
  ['Replit', 'Cloud IDE', LH + 'replit.svg'],
  ['v0', 'UI generator', LH + 'v0.svg'],
  ['Windsurf', 'AI code editor', LH + 'windsurf.svg', true],
  ['Claude Code', 'Coding agent', LH + 'claudecode.svg', true],
  ['GitHub Copilot', 'Pair programmer', LH + 'githubcopilot.svg', true],
];

function BuildersSection() {
  // One row of unique builders; the set is cloned once only so the loop is seamless.
  const pill = ([name, kind, src, isNew]: (typeof BUILDERS)[number], dup: boolean) => (
    <span key={`${name}-${dup}`} className={`logo-pill${dup ? ' dup' : ''}`} aria-hidden={dup || undefined}>
      <span className="lg"><img src={src} alt="" loading="lazy" /></span>
      <span className="nm">{name}<small>{kind}</small></span>
      {isNew && <span className="new">NEW</span>}
    </span>
  );
  return (
    <section className="lp-section lp-builders band" id="builders">
      <div className="wrap">
        <p className="kicker center" data-reveal>Seamless integration with your AI stack</p>
        <h2 className="h2" data-words><Words>Fix security flaws in the</Words><br /><Words>vibe coding tools</Words> <Accent>you love.</Accent></h2>
        <p className="lede" data-reveal style={{ maxWidth: 560, margin: '20px auto 0' }}>Sentinel gives you the exact prompt to paste back into your AI builder. Keep your workflow fast while keeping your app secure.</p>
      </div>
      <div className="ticker" data-reveal aria-label="Supported AI builders">
        <div className="track">{BUILDERS.map((b) => pill(b, false))}{BUILDERS.map((b) => pill(b, true))}</div>
      </div>
      <div className="wrap"><p className="lp-subtle">Sentinel provides prompt fixes compatible with any AI code generator. Not affiliated with these tools.</p></div>
    </section>
  );
}

export default function LandingPage(props: UrlFormProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  useLandingMotion(rootRef);
  return (
    <div className="lp" ref={rootRef}>
      <LandingHeader />
      <main id="main-content">
        <Hero {...props} />
        <HowItWorks />
        <WhySection />
        <ReportSection />
        <PricingSection />
        <CoverageSection />
        <BuildersSection />
        <FaqSection />
        <CtaFooter />
      </main>
      <WaitlistModal />
    </div>
  );
}
