import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ActionLink, Brand, Dialog, Icon, PreviewNote, ReportPreview, ScopeContent } from './components';
import type { UrlFormProps } from './components';
import { UserHeaderMenu } from './UserHeaderMenu';
import Hero from './Hero';
import { PricingSection } from './PricingSection';
import { FaqSection } from './FaqSection';
import { CtaFooter } from './CtaFooter';
import { WaitlistModal } from './WaitlistModal';

const publicLinks = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#coverage', label: 'Coverage' },
  { href: '#faq', label: 'FAQ' },
];

function LandingHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="public-header container">
      <Brand />
      <nav className="desktop-nav" aria-label="Website">
        {publicLinks.map((l) => (
          <a key={l.href} href={l.href}>
            {l.label}
          </a>
        ))}
        <Link to="/contact">Contact Us</Link>
      </nav>
      <div className="header-actions">
        <UserHeaderMenu />
        <Link className="header-workspace-link" to="/workspace">
          Open workspace
          <Icon name="arrow" />
        </Link>
        <button
          className="icon-button mobile-toggle"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Icon name="menu" />
        </button>
      </div>
      {open && (
        <Dialog title="Explore Sentinel" onClose={() => setOpen(false)}>
          <nav className="mobile-nav" aria-label="Mobile website">
            {publicLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
                <Icon name="arrow" />
              </a>
            ))}
            <Link to="/contact" onClick={() => setOpen(false)}>
              Contact Us
              <Icon name="arrow" />
            </Link>
            <Link to="/workspace" onClick={() => setOpen(false)}>
              Open workspace
              <Icon name="arrow" />
            </Link>
          </nav>
        </Dialog>
      )}
    </header>
  );
}

export default function LandingPage(props: UrlFormProps) {
  return (
    <>
      <LandingHeader />
      <main id="main-content">
        <Hero {...props} />

        <section className="section container why">
          <p className="section-kicker">Built for the vibe coding era</p>
          <div className="editorial-split">
            <h2>
              Vibe coding is fast.<br />Security flaws are <em>sneaky.</em>
            </h2>
            <div>
              <p className="large-copy">
                When you build apps by chatting with AI, functional UI appears in seconds, along with hidden cybersecurity blind spots.
              </p>
              <p>
                AI tools write functional code, but they do not automatically lock down your routes, protect your API keys, or enforce database rules. Sentinel is your digital companion that catches coding flaws early and tells you exactly how to fix them.
              </p>
              <a className="text-link" href="#how-it-works">
                Meet your digital companion
                <Icon name="arrow" />
              </a>
            </div>
          </div>
        </section>

        {/* FLAWS EXPLAINED / FIXES READY TO PROMPT (Harmonized with Key Benefits Content & Dark Aesthetic) */}
        <section
          id="flaws-explained"
          className="relative w-full bg-black text-white py-16 sm:py-24 overflow-hidden"
          style={{
            fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
        >
          {/* Blue Blobs from Key Benefits design */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -left-[360px] h-[480px] w-[480px] rounded-full bg-[#1e3a8a] blur-3xl opacity-40 pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -top-28 -right-28 h-64 w-64 rounded-full bg-[#1e3a8a] blur-3xl opacity-35 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-[1220px] mx-auto px-4 sm:px-6 md:px-10">
            <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-20 items-start">
              {/* Left Column: Section Intro & Preemptive Defense Overview */}
              <div className="flex flex-col">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 w-fit"
                  style={{
                    background: 'rgba(38, 75, 194, 0.16)',
                    border: '1.2px solid rgba(79, 118, 246, 0.35)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span className="text-[11px] font-semibold tracking-wider text-[#93c5fd] uppercase">
                    Key Benefits · Preemptive Defense
                  </span>
                </div>

                <h2
                  className="text-white text-3xl sm:text-4xl md:text-5xl font-light leading-tight tracking-tight mb-6"
                  style={{ letterSpacing: '-0.04em' }}
                >
                  Flaws explained.<br />
                  Fixes <em className="not-italic text-blue-400 font-serif italic">ready to prompt.</em>
                </h2>

                <p className="text-white/80 font-light text-sm sm:text-base leading-relaxed max-w-[380px] mb-4">
                  Defense platforms constantly observe bandwidth streams, record files, and machine behaviors to uncover unusual patterns or outliers that could signal a defensive failure.
                </p>

                <p className="text-white/60 font-light text-xs sm:text-sm leading-relaxed max-w-[380px]">
                  Sentinel translates complex vulnerabilities into clear explanations and instant fixes for your AI builder, no cybersecurity degree required.
                </p>
              </div>

              {/* Right Column: 3 Steps / Key Benefit Cards in Neutral-950 Aesthetic */}
              <div className="flex flex-col gap-4">
                {[
                  [
                    'Preemptive Risks Scouting',
                    'What is the vulnerability?',
                    'Defense platforms observe bandwidth streams, record files, and machine behaviors to uncover unusual patterns or outliers before attackers strike.',
                  ],
                  [
                    'Defensive Impact Analysis',
                    'Why is it a security risk?',
                    'Understand the real-world operational and privacy consequence of every leak, bypass, or misconfiguration without wading through jargon.',
                  ],
                  [
                    'Instant Reaction & Remediation',
                    'How do I fix it?',
                    'Copy Sentinel’s targeted fix prompt directly into your AI code builder (Cursor, Lovable, Bolt, v0) to resolve the flaw immediately.',
                  ],
                ].map(([q, h, p], i) => (
                  <div
                    key={q}
                    className="group relative rounded-2xl bg-neutral-950/80 border border-neutral-900 p-4 xs:p-5 sm:p-7 flex gap-3.5 sm:gap-6 items-start transition-all duration-300 hover:border-neutral-800 hover:-translate-y-0.5"
                    style={{
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <span
                      className="text-lg sm:text-2xl font-light text-blue-400/80 flex-shrink-0 pt-0.5 sm:pt-0"
                      style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                    >
                      0{i + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-white text-base sm:text-xl font-light leading-snug mb-1">
                        {q}
                      </h3>
                      <p className="text-white/70 font-light text-xs sm:text-sm leading-relaxed">
                        <strong className="text-white font-medium">{h}</strong> {p}
                      </p>
                    </div>

                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-neutral-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-blue-400 group-hover:border-blue-500/50 group-hover:bg-blue-950/30 transition-colors">
                      <Icon name="arrow" className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container section report-section">
          <div className="section-topline">
            <div>
              <p className="section-kicker">Clarity you can act on</p>
              <h2>
                A security report built for <em>AI builders.</em>
              </h2>
            </div>
            <p>
              The vulnerability analysis, real-world context, and exact prompt fix.<br />All delivered by your digital security companion.
            </p>
          </div>
          <ReportPreview compact />
          <div className="report-section-bottom">
            <PreviewNote>Interactive interface preview</PreviewNote>
            <ActionLink to="/workspace/reports" secondary>
              Explore the workspace
            </ActionLink>
          </div>
        </section>

        <section id="how-it-works" className="container section workflow">
          <p className="section-kicker">Your digital companion in action</p>
          <h2>
            From vibecoded app<br />to <em>hardened software.</em>
          </h2>
          <div className="workflow-steps">
            {[
              ['Recon', 'The Observer', 'Audit public surfaces, client assets, and response headers for coding flaws.', 'scope'],
              ['Translator', 'The Risk Explainer', 'Translate security vulnerabilities into clear, plain-English impact statements.', 'report'],
              ['Fix Doctor', 'The Prompt Fixer', 'Generate tailored fix prompts to paste straight back into your AI editor.', 'plan'],
            ].map(([name, role, copy, icon], i) => (
              <article key={name}>
                <div className="step-line">
                  <span className="step-icon">
                    <Icon name={icon as 'scope' | 'report' | 'plan'} />
                  </span>
                  <span>0{i + 1}</span>
                </div>
                <p className="step-role">{role}</p>
                <h3>{name}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* PRICING SECTION */}
        <PricingSection />

        <section id="coverage" className="coverage-section">
          <div className="container section">
            <p className="section-kicker">Honest about the whole picture</p>
            <h2>
              What Sentinel can, and <em>cannot</em>, see.
            </h2>
            <ScopeContent />
          </div>
        </section>

        <section className="container section builders">
          <p className="section-kicker">Seamless integration with your AI stack</p>
          <h2>
            Fix security flaws in the<br />vibe coding tools <em>you love.</em>
          </h2>
          <p>
            Sentinel gives you the exact prompt to paste back into your AI builder.<br />Keep your workflow fast while keeping your app secure.
          </p>
          <div className="builder-names">
            <span>Google AI Studio</span>
            <span>Cursor</span>
            <span>Lovable</span>
            <span>Bolt.new</span>
            <span>Replit</span>
            <span>v0</span>
          </div>
          <p className="subtle">Sentinel provides prompt fixes compatible with any AI code generator. Not affiliated with these tools.</p>
        </section>

        {/* FAQ SECTION (Interactive Search, 4 Category Cards & Smooth One-at-a-Time Accordion) */}
        <FaqSection />

      </main>

      {/* Cinematic HLS Video Call-to-Action & Liquid Glass Footer */}
      <CtaFooter />

      <WaitlistModal />
    </>
  );
}
