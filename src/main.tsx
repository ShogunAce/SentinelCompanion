import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Route, Routes, useLocation } from 'react-router-dom';
import LandingPage from './LandingPage';
import { PricingPage } from './PricingPage';
import { ContactPage } from './ContactPage';
import { PrivacyPage } from './PrivacyPage';
import { TermsPage } from './TermsPage';
import { ActionPlanPage, CompanionPage, CoveragePage, NewScanPage, OverviewPage, ReportLayoutPage, ReportsPage, WorkspaceLayout } from './Workspace';
import { AdminPanel } from './AdminPanel';
import { DraggableCompanionWidget } from './DraggableCompanionWidget';
import { CookieConsentBanner } from './CookieConsentBanner';
import './styles.css';
import './theme.css';
import './companionWidget.css';
import { AuthProvider, useAuth } from './AuthContext';
import { UsageProvider } from './UsageContext';
import { useNavigate } from 'react-router-dom';

function SignupRoute() {
  const { openAuthModal, user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      navigate('/workspace');
    } else {
      openAuthModal('signup');
    }
  }, [user, openAuthModal, navigate]);
  return <LandingPage value="" onChange={() => {}} />;
}

function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = pathname === '/'
      ? 'Sentinel — Digital Cybersecurity Companion for Vibecoded Apps'
      : pathname === '/pricing'
      ? 'Sentinel — Honest Pricing & Plans'
      : pathname === '/contact'
      ? 'Sentinel — Contact Security Team'
      : pathname === '/privacy'
      ? 'Sentinel — Privacy Policy'
      : pathname === '/terms' || pathname === '/tos'
      ? 'Sentinel — Terms of Service'
      : pathname === '/ops-nexus-903f' || pathname === '/admin'
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
    <BrowserRouter>
      <AuthProvider>
        <UsageProvider>
          <a className="skip-link" href="#main-content">Skip to content</a>
          <RouteEffects />
          <Routes>
            <Route path="/" element={<LandingPage {...form} />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/tos" element={<TermsPage />} />
            <Route path="/signup" element={<SignupRoute />} />
            <Route path="/workspace" element={<WorkspaceLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="companion" element={<CompanionPage />} />
              <Route path="new-scan" element={<NewScanPage {...form} />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="reports/layout" element={<ReportLayoutPage />} />
              <Route path="action-plan" element={<ActionPlanPage />} />
              <Route path="coverage" element={<CoveragePage />} />
            </Route>
            {/* Hardened admin paths: strictly checks admin email; otherwise renders standard 404 */}
            <Route path="/admin" element={<AdminPanel />} />
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

          {/* Freely movable robot companion widget & global cookie compliance */}
          <DraggableCompanionWidget />
          <CookieConsentBanner />
        </UsageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
