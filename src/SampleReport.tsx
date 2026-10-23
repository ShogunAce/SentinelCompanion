import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { FindingPayload } from './ReportBreakdownModal';
import './sampleReport.css';

// Interactive security report. Renders the built-in sample, or a live result from /api/scan
// (via fromScanResponse). Deductions and grade bands mirror src/report.js.

export type Severity = 'Critical' | 'Warning' | 'Minor';

export interface ReportFinding {
  id: string;
  severity: Severity;
  deduction: number;
  category: string;
  title: string;
  description: string;
  plain?: string;
  action: string;
  evidence?: string;
  prompt?: string;
}

export interface ReportData {
  origin: string;
  scannedAt: string;
  score: number;
  cached?: boolean;
  live?: boolean;
  coverage: { requests: number; scripts: number; checks: number | null; ms: number | null };
  notAssessed: string[];
  limitations: string;
  findings: ReportFinding[];
}

const DEDUCT: Record<Severity, number> = { Critical: 30, Warning: 10, Minor: 5 };
const SEV_CLASS: Record<Severity, string> = { Critical: 'crit', Warning: 'warn', Minor: 'minor' };
const GRADE: Record<string, [string, string]> = {
  A: ['#1F3BD6', 'Looking solid'], B: ['#4F6BEA', 'In good shape'], C: ['#C98A1E', 'Worth a look'],
  D: ['#D2566E', 'Needs attention'], F: ['#B4374F', 'Fix these first'],
};
const gradeOf = (s: number) => (s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 65 ? 'C' : s >= 50 ? 'D' : 'F');
const NOT_ASSESSED = ['Authentication', 'Authorization and access controls', 'Database rules'];
const LIMITATIONS = 'A passive check of the public home page and the scripts it loads directly. It is not a security audit, and a good grade is not a guarantee that your app is safe.';

const SOURCE = 'This finding comes from a passive Sentinel check of my public site, not a review of my code. Inspect my actual app and deployment before changing anything.';
const VERIFY = 'Test the change and verify the result before deploying, and explain exactly how to verify it. Do not claim the issue is fixed until it is verified.';

export const SAMPLE_REPORT: ReportData = {
  origin: 'https://your-app.com',
  scannedAt: 'Sample report',
  score: 50,
  coverage: { requests: 9, scripts: 6, checks: 11, ms: 2840 },
  notAssessed: NOT_ASSESSED,
  limitations: LIMITATIONS,
  findings: [
    {
      id: 'service-role', severity: 'Critical', deduction: 30, category: 'Client-side secrets',
      title: "Your database's admin key is public.",
      description: 'A token that bypasses your database access rules (a Supabase service-role key) is included in your public code. Anyone can use it to read or change any data.',
      plain: 'Think of this key as the master key to your building. Anyone who visits your site can pick it up and walk into every room: read, edit or delete any user’s data.',
      action: 'Rotate the key now and keep it server-side only.',
      evidence: 'assets/main.4f2a91.js · line 1, col 48211\nconst supabase = createClient(SUPABASE_URL,\n  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.•••• [redacted]")\ntoken role: service_role',
      prompt: `${SOURCE} Sentinel found a token whose role is service_role in browser code. Treat it as compromised: rotate the project's API keys or JWT secret in the Supabase dashboard first, because removing it from code does not revoke it. Use only the anon key in the browser, enable Row Level Security with explicit policies on every table, and use the service role only inside server-side code. Check recent database activity for misuse. ${VERIFY}`,
    },
    {
      id: 'csp-missing', severity: 'Warning', deduction: 10, category: 'Browser protections',
      title: 'Give your browser a list of trusted sources.',
      description: 'Your site does not send a Content Security Policy. A carefully tested policy can limit which scripts run if unwanted content gets into your app.',
      plain: 'Your site never tells the browser which scripts it trusts. If something sneaky ever slips in, the browser will happily run it.',
      action: 'Add and test a Content Security Policy.',
      evidence: 'Response headers for https://your-app.com/\nContent-Security-Policy: [not present]',
      prompt: `${SOURCE} Review my deployment for a Content Security Policy. Inventory the scripts, styles, fonts, connections and frames my app needs, then propose a restrictive policy using nonces or hashes where appropriate. Start with Content-Security-Policy-Report-Only and review violations before enforcing. Avoid broad wildcards and unsafe-eval. Test login, payments and embedded services. ${VERIFY}`,
    },
    {
      id: 'framing', severity: 'Minor', deduction: 5, category: 'Browser protections',
      title: 'Stop other sites from framing yours.',
      description: "Nothing tells browsers to refuse to show your app inside another site's page, which can be used to trick people into clicking things.",
      plain: 'Another website could load yours invisibly inside theirs and trick people into pressing buttons they can’t see.',
      action: 'Add frame-ancestors or X-Frame-Options.',
      evidence: 'Response headers\nX-Frame-Options and CSP frame-ancestors: [not present]',
      prompt: `${SOURCE} Add clickjacking protection: a Content-Security-Policy frame-ancestors directive (and X-Frame-Options for older browsers) that only allows my own origins to frame the app. Check I do not rely on being embedded anywhere. ${VERIFY}`,
    },
    {
      id: 'sourcemap', severity: 'Minor', deduction: 5, category: 'Information exposure',
      title: 'Your built code points to its readable source.',
      description: 'Your scripts reference source map files. If those files are public, anyone can read your original source code.',
      plain: 'Your app ships with a map back to its original code. It’s like leaving the blueprints taped to the front door.',
      action: 'Remove source maps from production, or confirm they are not public.',
      evidence: 'Scripts that point to source maps\n/assets/main.4f2a91.js  →  main.4f2a91.js.map\n/assets/vendor.9c1e07.js  →  vendor.9c1e07.js.map',
      prompt: `${SOURCE} My built scripts reference source maps. Check whether those .map files are publicly reachable. If they are, stop publishing them to production, or upload them only to an error-tracking service. ${VERIFY}`,
    },
  ],
};

const normSeverity = (s: unknown): Severity => {
  const v = String(s || '').toLowerCase();
  return v === 'critical' ? 'Critical' : v === 'minor' ? 'Minor' : 'Warning';
};

/** Adapts a live /api/scan response (src/report.js buildReport) to the report view. */
export function fromScanResponse(data: any, fallbackUrl: string): ReportData {
  const findings: ReportFinding[] = (Array.isArray(data?.findings) ? data.findings : []).map((f: any, i: number) => {
    const severity = normSeverity(f.severity);
    return {
      id: String(f.id ?? `finding-${i + 1}`),
      severity,
      deduction: typeof f.deduction === 'number' ? f.deduction : DEDUCT[severity],
      category: f.category || 'Finding',
      title: f.title || 'Untitled finding',
      description: f.description || '',
      action: f.action || '',
      evidence: f.evidence || undefined,
      prompt: f.prompt || undefined,
    };
  });
  const computed = Math.max(0, 100 - findings.reduce((s, f) => s + f.deduction, 0));
  const when = data?.cachedAt || data?.scannedAt;
  return {
    origin: data?.origin || data?.target?.origin || fallbackUrl,
    scannedAt: when ? new Date(when).toLocaleString() : 'Just now',
    score: typeof data?.score === 'number' ? data.score : computed,
    cached: !!data?.cached,
    live: true,
    coverage: {
      requests: data?.coverage?.requests ?? 0,
      scripts: data?.coverage?.scriptsChecked ?? 0,
      checks: Array.isArray(data?.checked) ? data.checked.length : data?.coverage?.checksRun ?? null,
      ms: data?.timing?.ms ?? null,
    },
    notAssessed: Array.isArray(data?.coverage?.notAssessed) ? data.coverage.notAssessed : NOT_ASSESSED,
    limitations: data?.limitations || LIMITATIONS,
    findings,
  };
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function TypedText({ text }: { text: string }) {
  const [n, setN] = useState(() => (reducedMotion() ? text.length : 0));
  useEffect(() => {
    if (n >= text.length) return;
    const t = setTimeout(() => setN(v => Math.min(text.length, v + 2)), n === 0 ? 250 : 16);
    return () => clearTimeout(t);
  }, [n, text]);
  return <>{text.slice(0, n)}{n < text.length && <span className="caret" />}</>;
}

interface Props {
  data?: ReportData;
  botSrc?: string;
  onBreakdown?: (finding: FindingPayload) => void;
  onRunScan?: () => void;
  openFirst?: boolean;
}

export function SampleReport({ data = SAMPLE_REPORT, botSrc = '/sentinel-bot-512.webp', onBreakdown, onRunScan, openFirst = true }: Props) {
  const uid = useId().replace(/:/g, '');
  const rootRef = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [filter, setFilter] = useState<'All' | Severity>('All');
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [fixed, setFixed] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Record<string, 'plain' | 'evidence' | 'prompt'>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  const [pop, setPop] = useState(0);

  const findings = data.findings;
  const score = Math.min(100, data.score + findings.filter(f => fixed.has(f.id)).reduce((s, f) => s + f.deduction, 0));
  const grade = gradeOf(score);
  const openF = findings.filter(f => !fixed.has(f.id));
  const count = (s: Severity, list = openF) => list.filter(f => f.severity === s).length;
  const R = 54, C = 2 * Math.PI * R;
  const host = data.origin.replace(/^https?:\/\//, '');

  // Reveal + first-open when scrolled into view
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      setSeen(true);
      if (openFirst && findings[0]) setOpen(new Set([findings[0].id]));
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [findings, openFirst]);

  // Count the score up/down
  useEffect(() => {
    if (!seen) return;
    if (reducedMotion()) { setShown(score); return; }
    let raf = 0;
    const from = shown, t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      setShown(Math.round(from + (score - from) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, seen]);

  const lastGrade = useRef(grade);
  useEffect(() => { if (lastGrade.current !== grade) { setPop(p => p + 1); lastGrade.current = grade; } }, [grade]);

  const toggle = (set: Set<string>, id: string) => { const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); return n; };

  const copy = async (key: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); }
    catch { setCopied(`${key}:blocked`); }
    setTimeout(() => setCopied(null), 1600);
  };
  const tell = (key: string) => { setFlash(key); setTimeout(() => setFlash(null), 1400); };

  const shownFindings = useMemo(() => findings.filter(f => filter === 'All' || f.severity === filter), [findings, filter]);
  const stack = [count('Critical') * 30, count('Warning') * 10, count('Minor') * 5];
  const withPrompts = findings.filter(f => f.prompt);

  return (
    <div className="sr" ref={rootRef}>
      <div className="sr-head">
        <div className="sr-head-l"><span className="sr-dots"><i /><i /><i /></span><strong>Security report</strong><span className="sr-url">{data.origin}</span></div>
        <div className="sr-head-r">
          {data.cached ? <span className="sr-chip cached">Cached result</span> : <span className="sr-chip live">{data.live ? 'Live passive' : 'Sample'}</span>}
          <span className="sr-date">{data.scannedAt}</span>
          {!data.live && <>
            <button className="sr-ghost" type="button" onClick={() => tell('share')}>{flash === 'share' ? 'Sample only' : '↗ Share'}</button>
            <button className="sr-ghost" type="button" onClick={() => tell('export')}>{flash === 'export' ? 'Sample only' : '⤓ Export PDF'}</button>
          </>}
        </div>
      </div>

      <div className="sr-body">
        <aside className="sr-side">
          <div className="sr-score">
            <div className="sr-ring">
              <svg viewBox="0 0 132 132" aria-hidden="true">
                <defs><linearGradient id={`srg-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E58FA8" /><stop offset=".5" stopColor="#1F3BD6" /><stop offset="1" stopColor="#A48BE0" /></linearGradient></defs>
                <circle className="trk" cx="66" cy="66" r={R} fill="none" strokeWidth="10" />
                <circle className="val" cx="66" cy="66" r={R} fill="none" strokeWidth="10" strokeLinecap="round" stroke={`url(#srg-${uid})`} strokeDasharray={C} strokeDashoffset={seen ? C * (1 - score / 100) : C} />
              </svg>
              <div className="sr-ring-in"><div>
                <span key={pop} className={`sr-grade${pop ? ' pop' : ''}`} style={{ color: GRADE[grade][0] }}>{seen ? grade : '–'}</span>
                <span className="sr-num">{shown} / 100</span>
              </div></div>
            </div>
            <div>
              <p className="sr-verdict">{GRADE[grade][1]}</p>
              <p className="sr-sub">{openF.length ? `${openF.length} open finding${openF.length > 1 ? 's' : ''} on ${host}` : findings.length ? 'No open findings. Rescan to confirm.' : `No findings on ${host}.`}</p>
            </div>
          </div>
          <div>
            <div className="sr-stack" aria-hidden="true">
              <i className="crit" style={{ flexGrow: stack[0] }} /><i className="warn" style={{ flexGrow: stack[1] }} /><i className="minor" style={{ flexGrow: stack[2] }} /><i className="ok" style={{ flexGrow: 100 - stack[0] - stack[1] - stack[2] }} />
            </div>
            <div className="sr-legend">
              <span><i style={{ background: '#C0394F' }} /><b>{count('Critical')}</b> critical</span>
              <span><i style={{ background: '#E0A43A' }} /><b>{count('Warning')}</b> warning</span>
              <span><i style={{ background: 'var(--lilac)' }} /><b>{count('Minor')}</b> minor</span>
            </div>
          </div>
          {findings.length > 0 && <p className="sr-hint">Flip <strong>Mark as fixed</strong> on any finding to preview how your grade improves after a rescan.</p>}
          <div className="sr-stats">
            <div className="sr-stat"><b>{data.coverage.requests}</b><span>Requests</span></div>
            <div className="sr-stat"><b>{data.coverage.scripts}</b><span>Scripts</span></div>
            <div className="sr-stat"><b>{data.coverage.checks ?? '—'}</b><span>Checks</span></div>
            <div className="sr-stat"><b>{data.coverage.ms != null ? `${(data.coverage.ms / 1000).toFixed(1)}s` : '—'}</b><span>Duration</span></div>
          </div>
          <div className="sr-na"><h5>Not assessed by a public scan</h5><ul>{data.notAssessed.map(n => <li key={n}>{n}</li>)}</ul></div>
        </aside>

        <section className="sr-main">
          <div className="sr-bar">
            <div className="sr-tabs" role="group" aria-label="Filter findings">
              {(['All', 'Critical', 'Warning', 'Minor'] as const).map(t => (
                <button key={t} type="button" aria-pressed={filter === t} onClick={() => setFilter(t)}>{t}<small>{t === 'All' ? findings.length : count(t, findings)}</small></button>
              ))}
            </div>
            {withPrompts.length > 0 && (
              <button className="sr-ghost" type="button" onClick={() => copy('all', withPrompts.map((f, i) => `${i + 1}. ${f.title}\n${f.prompt}`).join('\n\n'))}>
                {copied === 'all' ? '✓ Copied' : copied === 'all:blocked' ? 'Copy blocked' : '⧉ Copy all fix prompts'}
              </button>
            )}
          </div>

          {findings.length === 0 ? (
            <div className="sr-clean"><h4>Clean bill of health!</h4><p>No critical security issues, leaked keys, or missing basic headers were detected during this passive surface audit.</p></div>
          ) : (
            <div className="sr-list">
              {shownFindings.map(f => {
                const isOpen = open.has(f.id), isFixed = fixed.has(f.id);
                const hasPlain = !!f.plain;
                const current = tab[f.id] || (hasPlain ? 'plain' : f.evidence ? 'evidence' : 'prompt');
                const bodyId = `${uid}-${f.id}`;
                return (
                  <article key={f.id} className={`sr-f ${SEV_CLASS[f.severity]}${isOpen ? ' open' : ''}${isFixed ? ' fixed' : ''}`}>
                    <button className="sr-fh" type="button" aria-expanded={isOpen} aria-controls={bodyId} onClick={() => setOpen(o => toggle(o, f.id))}>
                      <span>
                        <span className="sr-meta"><span className="sr-sev">{f.severity}</span><span className="sr-cat">{f.category}</span><span className="sr-fixed-tag">✓ Fixed</span></span>
                        <span className="sr-ftitle">{f.title}</span>
                      </span>
                      <span className="sr-fr"><span className="sr-pts">−{f.deduction} pts</span><span className="sr-chev" aria-hidden="true">⌄</span></span>
                    </button>
                    <div className="sr-fb" id={bodyId}><div><div className="sr-fin">
                      <p className="sr-desc">{f.description}</p>
                      <div className="sr-itabs" role="tablist">
                        {hasPlain && <button type="button" role="tab" aria-selected={current === 'plain'} onClick={() => setTab(t => ({ ...t, [f.id]: 'plain' }))}>Plain English</button>}
                        {f.evidence && <button type="button" role="tab" aria-selected={current === 'evidence'} onClick={() => setTab(t => ({ ...t, [f.id]: 'evidence' }))}>Evidence</button>}
                        {f.prompt && <button type="button" role="tab" aria-selected={current === 'prompt'} onClick={() => setTab(t => ({ ...t, [f.id]: 'prompt' }))}>Fix prompt</button>}
                      </div>
                      {hasPlain && current === 'plain' && (
                        <div className="sr-pane on"><div className="sr-bot"><img src={botSrc} alt="" /><div className="sr-bubble">{isOpen ? <TypedText text={f.plain!} /> : null}</div></div></div>
                      )}
                      {f.evidence && current === 'evidence' && <div className="sr-pane on"><pre className="sr-code"><span className="k">Evidence</span>{f.evidence}</pre></div>}
                      {f.prompt && current === 'prompt' && (
                        <div className="sr-pane on"><div className="sr-prompt"><pre className="sr-code"><span className="k">Paste into Cursor, Lovable, Bolt, v0…</span>{f.prompt}</pre>
                          <button className="sr-copy" type="button" onClick={() => copy(f.id, f.prompt!)}>{copied === f.id ? 'COPIED' : copied === `${f.id}:blocked` ? 'SELECT' : 'COPY'}</button></div></div>
                      )}
                      <div className="sr-act">
                        {f.action && <p><strong>Recommended action:</strong> {f.action}</p>}
                        <div className="sr-act-r">
                          {onBreakdown && (
                            <button className="sr-bd" type="button" onClick={() => onBreakdown({ title: f.title, severity: f.severity.toLowerCase() as FindingPayload['severity'],description: f.description, evidence: f.evidence || f.action })}>
                              Break down with Gemini →
                            </button>
                          )}
                          <button className="sr-toggle" type="button" aria-pressed={isFixed} onClick={() => setFixed(s => toggle(s, f.id))}><span className="sr-sw" aria-hidden="true" />Mark as fixed</button>
                        </div>
                      </div>
                    </div></div></div>
                  </article>
                );
              })}
              {shownFindings.length === 0 && <p className="sr-empty" style={{ display: 'block' }}>Nothing in this filter.</p>}
            </div>
          )}
          <div className={`sr-toast${findings.length > 0 && openF.length === 0 ? ' on' : ''}`}>✨ <span>Every finding is marked fixed. Run a fresh scan to confirm the fixes held.</span></div>
        </section>
      </div>
      <div className="sr-foot">
        <p>{data.limitations}</p>
        {onRunScan && <a href="#" onClick={e => { e.preventDefault(); onRunScan(); }}>Run {data.live ? 'another' : 'a real'} scan →</a>}
      </div>
    </div>
  );
}
