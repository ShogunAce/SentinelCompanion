import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ActionLink, Brand, Dialog, EmptyState, FilterTabs, Icon, PreviewNote, ScopeContent, ScopeDialog, UrlForm } from './components';
import type { IconName, UrlFormProps } from './components';
import { ProtectedWorkspaceGuard } from './ProtectedRoute';
import { UserHeaderMenu } from './UserHeaderMenu';
import { useAuth } from './AuthContext';
import { db, logUserActivity } from './firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { GeminiChat } from './GeminiChat';
import { UsagePanel } from './UsagePanel';
import { useUsage } from './UsageContext';
import { WaitlistModal } from './WaitlistModal';
import { SampleReport, fromScanResponse } from './SampleReport';
import './workspace.css';

const destinations: { path: string; label: string; icon: IconName }[] = [
  { path: '/workspace', label: 'Overview', icon: 'overview' },
  { path: '/workspace/companion', label: 'Pip Companion', icon: 'shield' },
  { path: '/workspace/new-scan', label: 'New scan', icon: 'plus' },
  { path: '/workspace/reports', label: 'Reports', icon: 'report' },
  { path: '/workspace/action-plan', label: 'Action plan', icon: 'plan' },
  { path: '/workspace/coverage', label: 'Coverage', icon: 'scope' },
];

function WorkspaceNav({ onNavigate }: { onNavigate?: () => void }) { return <nav className="workspace-nav" aria-label="Workspace">{destinations.map(d => <NavLink to={d.path} end={d.path === '/workspace'} key={d.path} onClick={onNavigate}><Icon name={d.icon}/>{d.label}</NavLink>)}</nav>; }

export function WorkspaceLayout() {
  const [menu, setMenu] = useState(false);
  const [scope, setScope] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const location = useLocation();
  const active = destinations.find(d => d.path === location.pathname)?.label || 'Report layout';

  return (
    <div className="workspace-shell ws-theme">
      <aside className="sidebar">
        <Brand/>
        <span className="sidebar-label">Your workspace</span>
        <WorkspaceNav/>
        <SidebarUsage/>
        <div className="sidebar-bottom">
          <p>Pip — Digital companion. Secure vibe coding.</p>
          <span>Gemini AI Powered</span>
          <img src="/sentinel-bot-512.webp" alt="Pip Robot Mascot"/>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-header">
          <div className="workspace-breadcrumb">
            <button className="icon-button mobile-toggle" onClick={() => setMenu(true)} aria-expanded={menu} aria-label="Open workspace navigation">
              <Icon name="menu"/>
            </button>
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{active}</strong>
          </div>

          <div className="workspace-header-actions">
            <button
              className="button small"
              onClick={() => setChatOpen(!chatOpen)}
              style={{ gap: '8px' }}
            >
              <Icon name="shield" />
              {chatOpen ? 'Close Pip' : 'Talk to Pip'}
            </button>
            <UserHeaderMenu />
            <button className="icon-button" onClick={() => setScope(true)} aria-label="View scope and limitations">
              <Icon name="info"/>
            </button>
            <Link className="back-link" to="/">
              Back to website<Icon name="external"/>
            </Link>
          </div>
        </header>

        <main className="workspace-content" id="main-content">
          <ProtectedWorkspaceGuard>
            <Outlet/>
          </ProtectedWorkspaceGuard>
        </main>

        <footer className="workspace-footer">
          <span>Protected workspace · Firebase Auth & Gemini AI secured</span>
          <Link to="/workspace/coverage">Understand the scope<Icon name="arrow"/></Link>
        </footer>
      </div>

      {chatOpen && (
        <GeminiChat onClose={() => setChatOpen(false)} />
      )}

      {menu && (
        <Dialog title="Workspace navigation" onClose={() => setMenu(false)}>
          <WorkspaceNav onNavigate={() => setMenu(false)}/>
          <Link className="text-link" to="/">Back to website<Icon name="arrow"/></Link>
        </Dialog>
      )}

      {scope && <ScopeDialog onClose={() => setScope(false)}/>}
      <WaitlistModal />
    </div>
  );
}

function SidebarUsage() {
  const { currentPlan, scansUsed, companionUsed } = useUsage();
  const pct = (used: number, limit: number) => Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  const scans = pct(scansUsed, currentPlan.scansPerMonth);
  const msgs = pct(companionUsed, currentPlan.companionPerMonth);
  return (
    <div className="side-usage">
      <div className="side-usage-top">{currentPlan.name} plan <span>Active</span></div>
      <div className="side-meter"><span>Fresh scans <b>{scansUsed} / {currentPlan.scansPerMonth}</b></span><div className="side-bar"><i className={scans >= 100 ? 'full' : undefined} style={{ width: `${scans}%` }}/></div></div>
      <div className="side-meter"><span>Companion <b>{companionUsed} / {currentPlan.companionPerMonth}</b></span><div className="side-bar"><i className={msgs >= 100 ? 'full' : undefined} style={{ width: `${msgs}%` }}/></div></div>
    </div>
  );
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: React.ReactNode; description: string; action?: React.ReactNode }) { return <div className="page-heading"><div><p className="section-kicker">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>; }

export function CompanionPage() {
  return (
    <>
      <PageHeading
        eyebrow="Gemini AI Security Co-Pilot"
        title={<>Talk to Pip, your <em>digital companion.</em></>}
        description="Ask Pip anything about your vibecoded app's security, break down findings, or generate targeted prompts for Cursor, Lovable, Bolt, and v0."
      />
      <GeminiChat isEmbedded />
    </>
  );
}

export function OverviewPage() {
  const navigate = useNavigate();
  return (
    <>
      <PageHeading
        eyebrow="Digital Security Companion"
        title={<>Understand &amp; <em>fix</em> your vibecoded app with Pip.</>}
        description="Audit AI-generated code for cybersecurity vulnerabilities, catch logic flaws early, and generate targeted prompt fixes for your builder."
        action={<ActionLink to="/workspace/companion">Talk to Pip</ActionLink>}
      />

      {/* Plan and Usage Meters Panel */}
      <UsagePanel />

      <div className="overview-grid">
        <section className="surface latest-report">
          <div className="surface-heading">
            <h2>Interactive sample report</h2>
            <Link className="text-link" to="/workspace/reports/layout">Full layout<Icon name="arrow"/></Link>
          </div>
          <div className="overview-sample">
            <SampleReport onRunScan={() => navigate('/workspace/new-scan')} />
          </div>
        </section>

        <section className="surface overview-plan">
          <div className="surface-heading">
            <h2>Pip Companion Capabilities</h2>
            <Icon name="plan"/>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span className="small-icon" style={{ width: '36px', height: '36px' }}><Icon name="shield" /></span>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '600' }}>Multi-Model Security Reasoning</h4>
                  <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Powered by Gemini 3.8 Flash, Gemini 4 Argon, and Gemini 3.1 Lite.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span className="small-icon" style={{ width: '36px', height: '36px' }}><Icon name="report" /></span>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '600' }}>Deep Finding Breakdown</h4>
                  <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Plain-English explanations, attacker scenarios, and impact analysis.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span className="small-icon" style={{ width: '36px', height: '36px' }}><Icon name="plan" /></span>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '600' }}>Ready-to-Use Builder Prompts</h4>
                  <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Generate instant fix prompts for Cursor, Lovable, Bolt, and v0.</p>
                </div>
              </div>
            </div>
            <Link className="text-link" to="/workspace/companion" style={{ marginTop: '20px' }}>Start Conversation<Icon name="arrow"/></Link>
          </div>
        </section>
      </div>

      <section className="overview-coverage">
        <span className="small-icon"><Icon name="scope"/></span>
        <div>
          <h2>A clearer picture starts with an honest scope.</h2>
          <p>Sentinel inspects public surfaces, client assets, and response headers. Authentication, authorization, and database security rules require deeper access.</p>
        </div>
        <Link className="text-link" to="/workspace/coverage">Explore coverage<Icon name="arrow"/></Link>
      </section>
      <PreviewNote>The sample report uses illustrative findings. Run a scan to see your own.</PreviewNote>
    </>
  );
}

const SCAN_STEPS = ['Checking robots.txt', 'Fetching the home page', 'Inspecting response headers', 'Analyzing script bundles', 'Running deterministic checks'];

/** Visual progress while /api/scan runs; steps advance on a timer and the last one waits for the response. */
function ScanProgress({ url }: { url: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(SCAN_STEPS.length - 1, s + 1)), 700);
    return () => clearInterval(t);
  }, []);
  let host = url;
  try { host = new URL(url).hostname; } catch { /* keep raw input */ }
  return (
    <div className="surface scan-progress" role="status" aria-live="polite">
      <div className="scan-progress-top">
        <div className="scan-bot"><img src="/sentinel-bot-512.webp" alt=""/></div>
        <div><h3>Scanning {host || 'your app'}…</h3><p>Polite, read-only, rate-limited requests.</p></div>
      </div>
      <div className="scan-track"><i style={{ width: `${((step + 0.6) / SCAN_STEPS.length) * 100}%` }}/></div>
      <ul className="scan-steps">
        {SCAN_STEPS.map((s, i) => <li key={s} className={i < step ? 'done' : i === step ? 'run' : undefined}><i>{i < step ? '✓' : ''}</i>{s}</li>)}
      </ul>
    </div>
  );
}

export function NewScanPage(props: UrlFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetParam = searchParams.get('target');
  const autoParam = searchParams.get('auto');
  const hasAutoScannedRef = useRef(false);

  const { canScan, recordScan, resetDate, currentPlan, openWaitlistModal } = useUsage();
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanReport, setScanReport] = useState<any | null>(null);
  const [scannedUrl, setScannedUrl] = useState('');

  const handleRunScan = async (targetUrl: string) => {
    if (!targetUrl) return;

    // Check scan limit before running scan
    if (!canScan()) {
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setScanReport(null);
    setScannedUrl(targetUrl);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Scan could not be completed.');
      }
      setScanReport(data);

      // Record scan usage in UsageContext
      // If result has cached === true, recordScan will NOT count it
      recordScan(data.target?.origin || targetUrl, data.cached);

      if (user) {
        const scanId = `scan_${Date.now()}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'scans', scanId), {
            scanId,
            ownerId: user.uid,
            appUrl: targetUrl.slice(0, 300),
            status: 'completed',
            findingsCount: data.findings?.length || 0,
            scoreLetter: data.grade || 'A',
            createdAt: new Date().toISOString(),
          });
          await logUserActivity('scan_executed', {
            appUrl: targetUrl.slice(0, 150),
            grade: data.grade,
            findingsCount: data.findings?.length || 0,
            cached: !!data.cached
          });
        } catch (e) {
          console.warn('Could not record scan history:', e);
        }
      }
    } catch (err: any) {
      setScanError(err.message || 'An error occurred while scanning.');
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    if (targetParam) {
      props.onChange(targetParam);
      if (autoParam === 'true' && !hasAutoScannedRef.current) {
        hasAutoScannedRef.current = true;
        handleRunScan(targetParam);
      }
    }
  }, [targetParam, autoParam]);

  return (
    <>
      <PageHeading
        eyebrow="Audit your vibecoded app"
        title={<>Spot cybersecurity &amp; <em>coding flaws.</em></>}
        description="Enter your app’s address. Sentinel inspects public surfaces, client scripts, and response headers for security vulnerabilities with a polite, deterministic scan."
      />

      <div className="scan-layout">
        <div>
          {!canScan() ? (
            <div className="surface" style={{ padding: '28px', borderLeft: '4px solid #d97706', background: '#fffbeb', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
                Scan limit reached for this month
              </h3>
              <p style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.6, marginBottom: '20px' }}>
                You have used your {currentPlan.scansPerMonth} fresh scans this month. They reset on <strong>{resetDate}</strong>. Your last report is still here.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button className="button secondary small" onClick={() => navigate('/workspace/reports')}>
                  View last report
                </button>
                <button className="button small" onClick={() => openWaitlistModal('pro', 'monthly')}>
                  See Pro
                </button>
              </div>
            </div>
          ) : (
            <UrlForm
              {...props}
              workspace
              isScanning={isScanning}
              onSubmitScan={handleRunScan}
            />
          )}

          {isScanning && <ScanProgress url={scannedUrl || props.value} />}

          {scanError && (
            <div
              className="surface"
              style={{
                marginTop: '20px',
                padding: '20px',
                borderLeft: '4px solid #c81e1e',
                background: '#fffbfb',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#c81e1e', fontWeight: '700' }}>Scan Notice</span>
              </div>
              <p style={{ fontSize: '13px', color: '#252b36', marginTop: '6px' }}>{scanError}</p>
            </div>
          )}

          {scanReport && (
            <div className="scan-result">
              <SampleReport
                data={fromScanResponse(scanReport, scannedUrl || props.value)}
                openFirst
              />
            </div>
          )}

          <details className="scope-disclosure" style={{ marginTop: '24px' }}>
            <summary>What cybersecurity flaws does a public scan check?<span className="disclosure-mark">+</span></summary>
            <p>Exposed client assets, missing security headers, unsafe CORS configurations, and public route structure. This scan makes polite, rate-limited, read-only requests.</p>
            <Link className="text-link" to="/workspace/coverage">Read the full scope<Icon name="arrow"/></Link>
          </details>
        </div>

        <aside className="scan-aside">
          <Icon name="shield"/>
          <h2>Digital companion, honest scope.</h2>
          <p>A public URL scan detects observable surface flaws. Deeper authentication and database permissions need scoped testing.</p>
          <div className="aside-divider"/>
          <h3>Live Polite Scanner</h3>
          <p>Zero intrusive probing, strictly follows robots.txt, respects in-memory host pacing, and uses strict SSRF IP filters.</p>
        </aside>
      </div>
    </>
  );
}

export function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All reports');

  useEffect(() => {
    async function fetchReports() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const snap = await getDocs(collection(db, 'users', user.uid, 'scans'));
        const list = snap.docs.map(d => d.data());
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setReports(list);
      } catch (err) {
        console.warn('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [user]);

  const filtered = reports.filter(r => {
    if (search && !r.appUrl?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'With findings' && (r.findingsCount || 0) === 0) return false;
    return true;
  });

  return (
    <>
      <PageHeading
        eyebrow="Security Vulnerability Audits"
        title={<>Security <em>reports.</em></>}
        description="Review past audits, examine plain-English vulnerability findings, and grab copy-paste prompt fixes for your AI builder."
        action={<ActionLink to="/workspace/reports/layout" secondary>View report layout</ActionLink>}
      />

      <section className="surface report-library" aria-label="Report library">
        <div className="library-toolbar">
          <div className="search-field">
            <label htmlFor="report-search">Search reports</label>
            <div>
              <Icon name="search"/>
              <input
                id="report-search"
                type="search"
                placeholder="Search by app URL"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="library-filters">
          <FilterTabs
            label="Report filter"
            items={['All reports', 'With findings']}
            value={filter}
            onChange={setFilter}
          />
          {search && (
            <button className="text-button" onClick={() => setSearch('')}>
              Reset filters
            </button>
          )}
        </div>

        <div role="region" aria-label="Reports list" aria-live="polite" style={{ padding: '20px 24px' }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>Loading reports...</p>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={reports.length === 0 ? 'No completed scans yet.' : 'No scans match your search.'}
              action={<ActionLink to="/workspace/new-scan" secondary>Run a new scan</ActionLink>}
            >
              {reports.length === 0
                ? 'Run your first passive security scan to analyze public surfaces and client assets.'
                : 'Try adjusting your search query.'}
            </EmptyState>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filtered.map(r => (
                <div
                  key={r.scanId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px 20px',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    background: '#fafaf8',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600' }}>{r.appUrl}</h4>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                      Audited on {new Date(r.createdAt).toLocaleDateString()} at {new Date(r.createdAt).toLocaleTimeString()} · {r.findingsCount} finding{r.findingsCount === 1 ? '' : 's'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        background: '#f1f5f9',
                        color: r.scoreLetter === 'A' ? '#16a34a' : '#d97706'
                      }}
                    >
                      Grade {r.scoreLetter}
                    </span>
                    <ActionLink to="/workspace/new-scan" secondary>
                      Scan Again
                    </ActionLink>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
export function ReportLayoutPage() {
  const navigate = useNavigate();
  return <>
    <Link className="text-link back-to-reports" to="/workspace/reports">← Back to reports</Link>
    <PageHeading eyebrow="Sample Security Audit" title={<>Report layout <em>preview.</em></>} description="Preview how Sentinel organizes cybersecurity vulnerabilities, impact analysis, and builder prompt fixes. Open a finding and try marking it fixed."/>
    <SampleReport onRunScan={() => navigate('/workspace/new-scan')}/>
    <PreviewNote>Layout preview only. No app has been assessed.</PreviewNote>
  </>;
}
export function ActionPlanPage() { const [filter, setFilter] = useState('All'); return <><PageHeading eyebrow="Fix Prompt Library" title={<>Targeted AI builder <em>prompts.</em></>} description="Copy-paste prompts generated by Sentinel to patch security flaws directly in Cursor, Lovable, Bolt, v0, or AI Studio."/><section className="surface action-library"><div className="surface-heading"><FilterTabs items={['All', 'To review', 'Applied']} label="Action status" value={filter} onChange={setFilter}/><span className="subtle">Builder guidance</span></div><div aria-live="polite"><EmptyState icon="plan" title="No fix prompts queued." action={<ActionLink to="/workspace/new-scan" secondary>Go to new scan</ActionLink>}>Actionable AI prompts to fix security flaws will appear here after a scan.</EmptyState>{filter !== 'All' && <p className="filter-note">{filter === 'Applied' ? 'Applied fix prompts will be shown here when available.' : 'Fix prompts awaiting review will be shown here when available.'}</p>}</div></section><div className="action-note"><Icon name="info"/><p>Applying a prompt fix will still require review and verification.<br/><span className="subtle">A builder prompt is a starting point, not proof that a concern has been resolved.</span></p></div></>; }
export function CoveragePage() { return <><PageHeading eyebrow="Companion Scope & Boundaries" title={<>What Sentinel inspects in <em>vibecoded apps.</em></>} description="Understand which cybersecurity vulnerabilities Sentinel detects automatically and where deeper code reviews are needed."/><section className="surface coverage-view"><h2>What Sentinel can—and can’t—see.</h2><ScopeContent/></section><section className="current-preview"><h2>What this frontend currently does</h2><p>Explore the workspace, edit and locally validate an address, and review the intended report structure. Your inputs remain in temporary memory.</p><ul><li><Icon name="info"/>No live scanning.</li><li><Icon name="info"/>No source-code inspection.</li><li><Icon name="info"/>No authentication or database verification.</li></ul></section></>; }
