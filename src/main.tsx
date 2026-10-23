import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import LandingPage from './LandingPage';
import { PricingPage } from './PricingPage';
import { ContactPage } from './ContactPage';
import { ActionPlanPage, CompanionPage, CoveragePage, NewScanPage, OverviewPage, ReportLayoutPage, ReportsPage, WorkspaceLayout } from './Workspace';
import { AdminPanel } from './AdminPanel';
import './styles.css';
import './theme.css';
import { AuthProvider } from './AuthContext';
import { UsageProvider } from './UsageContext';

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = pathname === '/'
      ? 'Sentinel — Digital Security Companion for Vibecoded Apps'
      : pathname === '/pricing'
      ? 'Sentinel — Honest Pricing & Plans'
      : pathname === '/contact'
      ? 'Sentinel — Contact Security Team'
      : pathname === '/ops-nexus-903f'
      ? 'Sentinel — Ops Command'
      : 'Sentinel — Security Workspace';
    const main = document.querySelector<HTMLElement>('main');
    if (main) {
      main.tabIndex = -1;
      main.focus({ preventScroll: true });
    }
  }, [pathname]);
  return null;
}

function App() {
  const [url, setUrl] = useState('');
  const form = { value: url, onChange: setUrl };

  return (
    <AuthProvider>
      <UsageProvider>
        <BrowserRouter>
          <a className="skip-link" href="#main-content">Skip to content</a>
          <RouteEffects />
          <Routes>
            <Route path="/" element={<LandingPage {...form} />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/workspace" element={<WorkspaceLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="companion" element={<CompanionPage />} />
              <Route path="new-scan" element={<NewScanPage {...form} />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/layout" element={<ReportLayoutPage />} />
              <Route path="action-plan" element={<ActionPlanPage />} />
              <Route path="coverage" element={<CoveragePage />} />
            </Route>
            {/* Non-standard secret admin URL */}
            <Route path="/ops-nexus-903f" element={<AdminPanel />} />
            <Route
              path="*"
              element={
                <main className="not-found" id="main-content">
                  <h1>This page isn’t here.</h1>
                  <p>Find a clearer next step in the workspace.</p>
                  <Link className="button" to="/">Back to Sentinel</Link>
                </main>
              }
            />
          </Routes>
        </BrowserRouter>
      </UsageProvider>
    </AuthProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
