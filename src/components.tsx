import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export type IconName = 'shield' | 'arrow' | 'overview' | 'plus' | 'report' | 'plan' | 'scope' | 'search' | 'close' | 'menu' | 'globe' | 'check' | 'info' | 'external';
const paths: Record<IconName, ReactNode> = {
 shield: <><path d="M12 3 20 6v6c0 5-5 8-8 10-3-2-8-5-8-10V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></>,
 arrow: <><path d="M4 12h15m-5-5 5 5-5 5"/></>,
 overview: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
 plus: <path d="M12 5v14M5 12h14"/>, report: <><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5"/></>,
 plan: <><path d="m3 6 2 2 3-4m3 3h10M3 13l2 2 3-4m3 3h10M4 21h3m4 0h10"/></>,
 scope: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/></>,
 search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>, close: <path d="m6 6 12 12M6 18 18 6"/>, menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
 globe: <><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></>, check: <path d="m5 12 4 4L19 6"/>, info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.5"/></>, external: <path d="M8 5h11v11M19 5 5 19"/>,
};
export function Icon({ name, className = '' }: { name: IconName; className?: string }) { return <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>; }
export function Brand() { return <Link to="/" className="brand" aria-label="Sentinel home"><Icon name="shield"/>Sentinel<span className="brand-dot">.</span></Link>; }
export function ActionLink({ to, children, secondary = false }: { to: string; children: ReactNode; secondary?: boolean }) { return <Link className={`button ${secondary ? 'secondary' : ''}`} to={to}>{children}<Icon name="arrow"/></Link>; }
export function PreviewNote({ children }: { children?: ReactNode }) { return <p className="preview-note"><Icon name="info"/>{children || 'Frontend preview. Scanning is not connected.'}</p>; }
export const scopeGroups = [
 { title: 'Public-surface checks', intro: 'Sentinel audits your app’s public surface, client scripts, and response headers for cybersecurity & coding flaws.', items: ['Exposed client assets and secrets', 'Client-side scripts and API endpoints', 'HTTP response headers & security flags'] },
 { title: 'Checks that need deeper access', intro: 'Full backend authentication behavior, database rules, and private API routes require deeper access or scoped testing.', items: ['Backend authentication behavior', 'Authorization and access controls', 'Database rules and RLS permissions'] },
];
export function ScopeContent() { return <><div className="scope-grid">{scopeGroups.map((g, i) => <section key={g.title} className="scope-group"><Icon name={i === 0 ? 'globe' : 'shield'}/><h3>{g.title}</h3><p>{g.intro}</p><ul>{g.items.map(item => <li key={item}>{item}</li>)}</ul></section>)}</div><div className="scope-foot"><strong>A public URL scan inspects open surface signals.</strong><p>Deeper backend protections need scoped verification.</p></div></>; }
export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
 const ref = useRef<HTMLDialogElement>(null); const id = useId();
 useEffect(() => { const previous = document.activeElement as HTMLElement; const dialog = ref.current; dialog?.showModal(); return () => { dialog?.close(); previous?.focus(); }; }, []);
 return <dialog ref={ref} aria-labelledby={id} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="dialog-head"><h2 id={id}>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>;
}
export function ScopeDialog({ onClose }: { onClose: () => void }) { return <Dialog title="A clearer view. An honest scope." onClose={onClose}><ScopeContent/><PreviewNote/></Dialog>; }
export function validateUrl(value: string) { if (!value.trim()) return ''; try { const url = new URL(value.trim()); if (!['https:', 'http:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) return 'Enter a public http:// or https:// address without credentials.'; return ''; } catch { return 'Enter a complete URL, such as https://your-app.com.'; } }
export interface UrlFormProps { value: string; onChange: (value: string) => void; workspace?: boolean; compact?: boolean; onSubmitScan?: (url: string) => void; isScanning?: boolean; }
export function UrlForm({ value, onChange, workspace = false, compact = false, onSubmitScan, isScanning = false }: UrlFormProps) {
 const navigate = useNavigate(); const id = useId(); const [error, setError] = useState('');
 function validate() { const message = validateUrl(value); setError(message); return !message; }
 return <form className={`url-panel ${workspace ? 'workspace-url' : ''}`} noValidate onSubmit={e => {
   e.preventDefault();
   if (!validate()) return;
   if (onSubmitScan) {
     onSubmitScan(value.trim());
   } else if (!workspace) {
     navigate('/workspace/new-scan');
   }
 }}>{!compact && <div className="url-panel-heading"><span className="small-icon"><Icon name="globe"/></span><div><h2>Audit your vibecoded app.</h2><p>Catch cybersecurity & coding flaws early.</p></div></div>}<label htmlFor={id}>App URL</label><div className="url-input-row"><input id={id} type="url" autoComplete="off" spellCheck={false} placeholder="https://your-app.com" value={value} onChange={e => { onChange(e.target.value); if (error) setError(validateUrl(e.target.value)); }} onBlur={validate} aria-invalid={!!error} aria-describedby={[!compact && `${id}-note`, error && `${id}-error`].filter(Boolean).join(' ') || undefined}/><button className="button" type="submit" disabled={isScanning}>{isScanning ? 'Scanning app...' : workspace ? 'Run scan' : compact ? 'Open workspace' : 'Open scan workspace'}<Icon name="arrow"/></button></div>{error && <p className="input-error" id={`${id}-error`} role="alert">{error}</p>}{!compact && <p className="preview-note" id={`${id}-note`}><Icon name="info"/>{workspace ? 'Polite, safe passive scan checking headers, exposed secrets, and scripts.' : 'Passive scan service connected. Enter any public website.'}</p>}</form>;
}
export function EmptyState({ icon = 'report', title, children, action }: { icon?: IconName; title: string; children: ReactNode; action?: ReactNode }) { return <div className="empty-state"><span className="empty-icon"><Icon name={icon}/></span><h3>{title}</h3><p>{children}</p>{action}</div>; }
export function FilterTabs({ items, value, onChange, label }: { items: string[]; value: string; onChange: (value: string) => void; label: string }) { return <div className="filter-tabs" role="group" aria-label={label}>{items.map(item => <button key={item} aria-pressed={value === item} onClick={() => onChange(item)}>{item}</button>)}</div>; }
import { ReportBreakdownModal } from './ReportBreakdownModal';
import type { FindingPayload } from './ReportBreakdownModal';

export const sampleFindings: FindingPayload[] = [
  {
    title: 'Exposed Service Role Key in Client Bundle',
    severity: 'critical',
    description: 'A secret database service key (VITE_SUPABASE_SERVICE_ROLE) was bundled into client-side JS assets.',
    evidence: 'const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9...";',
  },
  {
    title: 'Missing Content-Security-Policy (CSP) Header',
    severity: 'warning',
    description: 'HTTP response headers do not restrict inline script execution or external domains.',
    evidence: 'HTTP/1.1 200 OK\nContent-Type: text/html\n(X-Frame-Options & CSP headers absent)',
  },
  {
    title: 'Unrestricted Database Access Rule',
    severity: 'critical',
    description: 'Database collection /users allows unauthenticated read and write access.',
    evidence: 'match /users/{userId} { allow read, write: if true; }',
  },
];

export const reportSections = ['Summary', 'Findings', 'Evidence', 'Recommended next steps', 'Builder prompts', 'Coverage and limitations'];

export function ReportPreview({ compact = false, onOpenChatWithPrompt }: { compact?: boolean; onOpenChatWithPrompt?: (prompt: string) => void }) {
  const [section, setSection] = useState('Summary');
  const [selectedFinding, setSelectedFinding] = useState<FindingPayload | null>(null);

  return (
    <div className={`report-preview ${compact ? 'compact' : ''}`}>
      <div className="report-preview-head">
        <span><Icon name="report" /> {compact ? 'Your security report' : 'Report layout preview'}</span>
        <span className="subtle">3 sample findings loaded</span>
      </div>

      <div className="report-preview-body">
        <nav aria-label="Report sections">
          {reportSections.map((s) => (
            <button key={s} aria-pressed={section === s} onClick={() => setSection(s)}>
              {s}
              {section === s && <Icon name="arrow" />}
            </button>
          ))}
        </nav>

        <div className="report-content">
          <span className="subtle">{section}</span>

          {section === 'Summary' && (
            <div className="summary-preview-grid" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: '#f8f8f3', padding: '16px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <span style={{ fontSize: '48px', fontWeight: '700', color: '#c81e1e', lineHeight: '1' }}>C+</span>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: '600' }}>Vulnerability Summary</h4>
                  <p style={{ fontSize: '12px', color: 'var(--muted)' }}>2 Critical issues, 1 Warning detected in client assets.</p>
                </div>
              </div>
              <p style={{ fontSize: '13px' }}>Click <strong>Findings</strong> or <strong>Builder prompts</strong> to break down vulnerabilities with the Gemini AI Companion.</p>
            </div>
          )}

          {section === 'Findings' && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sampleFindings.map((f) => (
                <div key={f.title} className={`card ${f.severity}`} style={{ padding: '16px', background: '#fcfcf9', border: '1px solid var(--line)', borderRadius: '8px', borderLeft: f.severity === 'critical' ? '4px solid #c81e1e' : '4px solid #d97706' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '600' }}>{f.title}</h3>
                    <span className={`finding-severity-badge ${f.severity}`} style={{ fontSize: '10px' }}>{f.severity.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: '12px', marginTop: '6px', color: 'var(--muted)' }}>{f.description}</p>
                  <button
                    className="button small"
                    style={{ marginTop: '12px' }}
                    onClick={() => setSelectedFinding(f)}
                  >
                    Break down with Gemini AI
                    <Icon name="arrow" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {section === 'Evidence' && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sampleFindings.map((f) => (
                <div key={f.title} style={{ padding: '12px', background: '#252b36', color: '#fff', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px' }}>
                  <span style={{ color: '#818cf8', fontWeight: 'bold' }}>// {f.title}</span>
                  <pre style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{f.evidence}</pre>
                </div>
              ))}
            </div>
          )}

          {section === 'Builder prompts' && (
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '16px', background: '#f8f8f3', border: '1px solid var(--line)', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Targeted Prompt Fix: Service Role Key</h4>
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>Copy-paste into Cursor / Lovable / Bolt:</p>
                <div style={{ padding: '12px', background: '#fff', border: '1px solid var(--line)', borderRadius: '6px', fontFamily: 'monospace', fontSize: '11px', whiteSpace: 'pre-wrap' }}>
                  "Refactor frontend asset references to remove VITE_SUPABASE_SERVICE_ROLE. Move all privileged backend operations into server API proxy routes."
                </div>
              </div>
            </div>
          )}

          {section === 'Recommended next steps' && (
            <div style={{ marginTop: '14px' }}>
              <p style={{ fontSize: '13px' }}>1. Remove all exposed API keys from frontend `.env` files.</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>2. Enforce strict `firestore.rules` or server-side authorization checks.</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>3. Configure strict HTTP security response headers.</p>
            </div>
          )}

          {section === 'Coverage and limitations' && (
            <div className="report-scope">
              <p>A public surface scan inspects client-side JS bundles, HTML source, and HTTP headers.</p>
              <p>Backend database rules and server routes require authenticated AI companion auditing.</p>
              <PreviewNote />
            </div>
          )}
        </div>
      </div>

      {selectedFinding && (
        <ReportBreakdownModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onOpenChatWithPrompt={onOpenChatWithPrompt}
        />
      )}
    </div>
  );
}



