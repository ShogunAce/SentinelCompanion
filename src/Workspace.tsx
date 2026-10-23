import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ActionLink, Brand, Dialog, EmptyState, FilterTabs, Icon, PreviewNote, ReportPreview, ScopeContent, ScopeDialog, UrlForm } from './components';
import type { IconName, UrlFormProps } from './components';
import { ProtectedWorkspaceGuard } from './ProtectedRoute';
import { UserHeaderMenu } from './UserHeaderMenu';
import { useAuth } from './AuthContext';
import { db, logUserActivity } from './firebase';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { ReportBreakdownModal } from './ReportBreakdownModal';
import type { FindingPayload } from './ReportBreakdownModal';
import { GeminiChat } from './GeminiChat';
import { UsagePanel } from './UsagePanel';
import { useUsage } from './UsageContext';
import { WaitlistModal } from './WaitlistModal';

const destinations: { path: string; label: string; icon: IconName }[] = [
  { path: '/workspace', label: 'Overview', icon: 'overview' },
  { path: '/workspace/companion', label: 'AI Companion', icon: 'shield' },
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
    <div className="workspace-shell">
      <aside className="sidebar">
        <Brand/>
        <span className="sidebar-label">Your workspace</span>
        <WorkspaceNav/>
        <div className="sidebar-bottom">
          <Icon name="shield"/>
          <p>Digital companion.<br/>Secure vibe coding.</p>
          <span>Gemini AI Powered</span>
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
              {chatOpen ? 'Close Companion' : 'Talk to Gemini'}
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

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) { return <div className="page-heading"><div><p className="section-kicker">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>{action}</div>; }

export function CompanionPage() {
  return (
    <>
      <PageHeading
        eyebrow="Gemini AI Security Co-Pilot"
        title="Talk to your Digital Companion"
        description="Ask Sentinel anything about your vibecoded app's security, break down findings, or generate targeted prompts for Cursor, Lovable, and Bolt."
      />
      <GeminiChat isEmbedded />
    </>
  );
}

export function OverviewPage() {
  return (
    <>
      <PageHeading
        eyebrow="Digital Security Companion"
        title="Understand & fix your vibecoded app."
        description="Audit AI-generated code for cybersecurity vulnerabilities, catch logic flaws early, and generate targeted prompt fixes for your builder."
        action={<ActionLink to="/workspace/companion">Talk to Gemini AI</ActionLink>}
      />

      {/* Plan and Usage Meters Panel */}
      <UsagePanel />

      <div className="overview-grid">
        <section className="surface latest-report">
          <div className="surface-heading">
            <h2>Interactive Sample Report</h2>
            <Link className="text-link" to="/workspace/reports/layout">Full Layout<Icon name="arrow"/></Link>
          </div>
          <div style={{ padding: '16px' }}>
            <ReportPreview compact />
          </div>
        </section>

        <section className="surface overview-plan">
          <div className="surface-heading">
            <h2>AI Companion Capabilities</h2>
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
      <PreviewNote/>
    </>
  );
}

export function NewScanPage(props: UrlFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canScan, recordScan, resetDate, currentPlan, openWaitlistModal } = useUsage();
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanReport, setScanReport] = useState<any | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<FindingPayload | null>(null);
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  const handleRunScan = async (targetUrl: string) => {
    if (!targetUrl) return;

    // Check scan limit before running scan
    if (!canScan()) {
      return;
    }

    setIsScanning(true);
    setScanError(null);
    setScanReport(null);

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

  const copyPrompt = (id: string, promptText: string) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2500);
  };

  return (
    <>
      <PageHeading
        eyebrow="Audit your vibecoded app"
        title="Spot cybersecurity & coding flaws."
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

          {isScanning && (
            <div className="surface" style={{ marginTop: '20px', padding: '24px', textAlign: 'center' }}>
              <div className="empty-icon" style={{ margin: '0 auto 16px' }}>
                <Icon name="shield" />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Scanning your app...</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '8px' }}>
                Checking robots.txt, inspecting security headers, analyzing script bundles, and testing against 11 deterministic checks.
              </p>
            </div>
          )}

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
            <div className="surface" style={{ marginTop: '28px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '20px' }}>
                <div>
                  <span className="section-kicker" style={{ marginBottom: '6px' }}>Scan Report · {scanReport.target.origin}</span>
                  <h2 style={{ fontSize: '24px', marginTop: '4px' }}>Security Audit Result</h2>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px' }}>{scanReport.summary}</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8f8f3', padding: '14px 22px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '38px',
                      fontWeight: '800',
                      lineHeight: '1',
                      color: scanReport.grade === 'A' ? '#16a34a' : scanReport.grade.startsWith('B') ? '#2563eb' : scanReport.grade.startsWith('C') ? '#d97706' : '#dc2626'
                    }}>
                      {scanReport.grade}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Score {scanReport.score}/100</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', padding: '16px 0', borderBottom: '1px solid var(--line)', fontSize: '12px', color: 'var(--muted)' }}>
                <span><strong>{scanReport.coverage?.requests ?? 0}</strong> HTTP requests</span>
                <span><strong>{scanReport.coverage?.scriptsChecked ?? 0}</strong> scripts inspected</span>
                <span><strong>{scanReport.coverage?.checksRun ?? 0}</strong> checks run</span>
                <span><strong>{scanReport.timing?.ms ?? 0}ms</strong> duration</span>
              </div>

              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '16px' }}>
                  Findings ({scanReport.findings?.length ?? 0})
                </h3>

                {scanReport.findings?.length === 0 ? (
                  <div style={{ padding: '24px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', color: '#166534' }}>
                    <h4 style={{ fontWeight: '600', fontSize: '14px' }}>Clean bill of health!</h4>
                    <p style={{ fontSize: '12px', marginTop: '4px', color: '#15803d' }}>
                      No critical security issues, leaked keys, or missing basic headers were detected during this passive surface audit.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {scanReport.findings.map((f: any) => {
                      const sev = (f.severity || 'warning').toLowerCase();
                      const sevColor = sev === 'critical' ? '#dc2626' : sev === 'warning' ? '#d97706' : '#2563eb';
                      return (
                        <div
                          key={f.id}
                          className="surface"
                          style={{
                            padding: '20px',
                            borderLeft: `4px solid ${sevColor}`,
                            background: '#fcfcf9',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                            <div>
                              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: '600' }}>
                                {f.category}
                              </span>
                              <h4 style={{ fontSize: '16px', fontWeight: '600', marginTop: '4px' }}>{f.title}</h4>
                            </div>
                            <span
                              className={`finding-severity-badge ${sev}`}
                              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px' }}
                            >
                              {f.severity.toUpperCase()} (-{f.deduction} pts)
                            </span>
                          </div>

                          <p style={{ fontSize: '13px', marginTop: '10px', color: 'var(--ink)' }}>{f.description}</p>

                          {f.evidence && (
                            <div style={{ marginTop: '12px', padding: '12px', background: '#1e2430', color: '#e2e8f0', borderRadius: '6px', fontFamily: 'monospace', fontSize: '12px', overflowX: 'auto' }}>
                              <span style={{ color: '#94a3b8', fontSize: '10px' }}>Evidence:</span>
                              <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{f.evidence}</pre>
                            </div>
                          )}

                          <div style={{ marginTop: '14px', background: '#f1f5f9', padding: '12px 16px', borderRadius: '6px' }}>
                            <strong style={{ fontSize: '12px', color: '#1e293b' }}>Recommended Action: </strong>
                            <span style={{ fontSize: '12px', color: '#475569' }}>{f.action}</span>
                          </div>

                          {f.prompt && (
                            <div style={{ marginTop: '14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted)' }}>Ready-to-use Prompt for Cursor / Lovable / Bolt:</span>
                                <button
                                  className="button small"
                                  style={{ padding: '6px 12px', minHeight: '32px', fontSize: '11px' }}
                                  onClick={() => copyPrompt(f.id, f.prompt)}
                                >
                                  {copiedPromptId === f.id ? 'Copied Prompt!' : 'Copy Fix Prompt'}
                                  <Icon name="plan" />
                                </button>
                              </div>
                              <pre style={{ margin: 0, padding: '12px', background: '#ffffff', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '11px', whiteSpace: 'pre-wrap', color: 'var(--ink)' }}>
                                {f.prompt}
                              </pre>
                            </div>
                          )}

                          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                            <button
                              className="button small"
                              onClick={() => setSelectedFinding({
                                title: f.title,
                                severity: sev as any,
                                description: f.description,
                                evidence: f.evidence || f.action,
                              })}
                            >
                              Break down with Gemini AI
                              <Icon name="arrow" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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

      {selectedFinding && (
        <ReportBreakdownModal
          finding={selectedFinding}
          appUrl={scanReport?.target?.origin || props.value}
          onClose={() => setSelectedFinding(null)}
        />
      )}
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
        title="Security Reports"
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
export function ReportLayoutPage() { return <><Link className="text-link back-to-reports" to="/workspace/reports">← Back to reports</Link><PageHeading eyebrow="Sample Security Audit" title="Report Layout Preview" description="Preview how Sentinel organizes cybersecurity vulnerabilities, impact analysis, and builder prompt fixes."/><ReportPreview/><PreviewNote>Layout preview only. No app has been assessed.</PreviewNote></>; }
export function ActionPlanPage() { const [filter, setFilter] = useState('All'); return <><PageHeading eyebrow="Fix Prompt Library" title="Targeted AI Builder Prompts" description="Copy-paste prompts generated by Sentinel to patch security flaws directly in Cursor, Lovable, Bolt, v0, or AI Studio."/><section className="surface action-library"><div className="surface-heading"><FilterTabs items={['All', 'To review', 'Applied']} label="Action status" value={filter} onChange={setFilter}/><span className="subtle">Builder guidance</span></div><div aria-live="polite"><EmptyState icon="plan" title="No fix prompts queued." action={<ActionLink to="/workspace/new-scan" secondary>Go to new scan</ActionLink>}>Actionable AI prompts to fix security flaws will appear here after a scan.</EmptyState>{filter !== 'All' && <p className="filter-note">{filter === 'Applied' ? 'Applied fix prompts will be shown here when available.' : 'Fix prompts awaiting review will be shown here when available.'}</p>}</div></section><div className="action-note"><Icon name="info"/><p>Applying a prompt fix will still require review and verification.<br/><span className="subtle">A builder prompt is a starting point, not proof that a concern has been resolved.</span></p></div></>; }
export function CoveragePage() { return <><PageHeading eyebrow="Companion Scope & Boundaries" title="What Sentinel inspects in vibecoded apps." description="Understand which cybersecurity vulnerabilities Sentinel detects automatically and where deeper code reviews are needed."/><section className="surface coverage-view"><h2>What Sentinel can—and can’t—see.</h2><ScopeContent/></section><section className="current-preview"><h2>What this frontend currently does</h2><p>Explore the workspace, edit and locally validate an address, and review the intended report structure. Your inputs remain in temporary memory.</p><ul><li><Icon name="info"/>No live scanning.</li><li><Icon name="info"/>No source-code inspection.</li><li><Icon name="info"/>No authentication or database verification.</li></ul></section></>; }
