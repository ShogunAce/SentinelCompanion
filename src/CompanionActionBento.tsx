import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export function CompanionActionBento() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100', 'translate-y-0');
            entry.target.classList.remove('opacity-0', 'translate-y-6');
          }
        });
      },
      { threshold: 0.1 }
    );

    const cards = containerRef.current?.querySelectorAll('.bento-animate');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="how-it-works"
      ref={containerRef}
      className="w-full bg-[#0F1112] text-white py-20 px-4 sm:px-6 lg:px-12 transition-colors duration-300 relative overflow-hidden"
      style={{
        fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Background Subtle Lab Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="max-w-[1224px] mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 bento-animate opacity-0 translate-y-6 transition-all duration-700 ease-out">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1F3BD6]" />
            <span className="text-[11px] font-mono font-medium tracking-widest text-white/70 uppercase">
              01 — 04 // COMPANION ARCHITECTURE
            </span>
          </div>

          <h2
            className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white mb-6"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Your digital companion <em className="italic font-normal text-[#60a5fa]">in action.</em>
          </h2>

          <p className="text-[#A1A1A1] text-lg sm:text-xl font-light leading-relaxed max-w-2xl mx-auto">
            From <span className="text-white font-normal">vibecoded app</span> to <span className="text-white font-normal">hardened software</span> in four automated steps.
          </p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded text-xs font-mono tracking-wider uppercase font-semibold bg-white text-black hover:bg-[#E9E9E9] transition-all duration-200"
            >
              EXPLORE CAPABILITIES →
            </a>
            <Link
              to="/workspace"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded text-xs font-mono tracking-wider uppercase font-semibold border border-white/20 text-white/80 hover:bg-white/10 hover:border-white/40 transition-all duration-200"
            >
              LAUNCH WORKSPACE
            </Link>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="flex flex-col gap-6">
          {/* Card 01: Full Width Row (The Observer / Recon) */}
          <div className="bento-animate opacity-0 translate-y-6 transition-all duration-700 ease-out delay-100 group relative rounded-2xl bg-gradient-to-br from-[#1B1D1E] to-[#141617] border border-white/[0.08] hover:border-white/20 p-6 sm:p-8 lg:p-10 transition-all duration-300">
            <div
              className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
              style={{
                background: 'radial-gradient(circle at top left, rgba(31, 59, 214, 0.15), transparent 60%)',
              }}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
              {/* Panel SVG Illustration */}
              <div className="lg:col-span-6 order-2 lg:order-1 rounded-xl bg-[#0B0C0D] border border-white/10 p-6 flex flex-col justify-between min-h-[260px] relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono text-white/40 border-b border-white/10 pb-3 mb-4">
                  <span>SYSTEM // AUDIT_ENGINE_V1</span>
                  <span className="text-emerald-400 font-semibold">● ACTIVE RECON</span>
                </div>

                {/* SVG Technical Diagram */}
                <div className="my-auto py-4 flex justify-center items-center">
                  <svg width="340" height="140" viewBox="0 0 340 140" fill="none" className="w-full max-w-[340px]">
                    {/* Background Grid */}
                    <path d="M0 20H340M0 70H340M0 120H340" stroke="white" strokeOpacity="0.05" strokeDasharray="2 4" />
                    <path d="M60 0V140M170 0V140M280 0V140" stroke="white" strokeOpacity="0.05" strokeDasharray="2 4" />

                    {/* Nodes */}
                    <g className="animate-pulse">
                      <circle cx="60" cy="70" r="18" fill="#1B1D1E" stroke="#1F3BD6" strokeWidth="2" />
                      <text x="60" y="73" fill="#60a5fa" fontSize="9" fontFamily="monospace" textAnchor="middle">CORS</text>
                    </g>

                    <path d="M78 70H152" stroke="#1F3BD6" strokeWidth="1.5" strokeDasharray="4 2" />

                    <g>
                      <circle cx="170" cy="70" r="22" fill="#141617" stroke="#ffffff" strokeOpacity="0.3" strokeWidth="1.5" />
                      <text x="170" y="73" fill="#ffffff" fontSize="10" fontFamily="monospace" textAnchor="middle">HEADERS</text>
                    </g>

                    <path d="M192 70H262" stroke="#1F3BD6" strokeWidth="1.5" strokeDasharray="4 2" />

                    <g>
                      <circle cx="280" cy="70" r="18" fill="#1B1D1E" stroke="#1F3BD6" strokeWidth="2" />
                      <text x="280" y="73" fill="#60a5fa" fontSize="9" fontFamily="monospace" textAnchor="middle">ASSETS</text>
                    </g>

                    {/* Radar Pulse Line */}
                    <path d="M20 30L170 70L320 110" stroke="rgba(96, 165, 250, 0.25)" strokeWidth="1" />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-white/50 pt-3 border-t border-white/10">
                  <span>SURFACE: PUBLIC ENDPOINTS</span>
                  <span className="text-white/70">$ sentinel recon --all</span>
                </div>
              </div>

              {/* Copy */}
              <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono font-semibold text-[#60a5fa] px-2 py-0.5 rounded bg-[#1F3BD6]/20 border border-[#1F3BD6]/40">
                    01 // RECON
                  </span>
                  <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Automated Audit</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-light text-white mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  The Observer
                </h3>

                <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6 font-light">
                  Audit public surfaces, client assets, and response headers for coding flaws in seconds.
                </p>

                <ul className="flex flex-col gap-2.5 mb-8 text-xs sm:text-sm text-white/60 font-mono">
                  <li className="flex items-center gap-2">
                    <span className="text-[#60a5fa]">11.</span>
                    <span>Deep surface scanning across CORS, CSP, and security headers.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#60a5fa]">12.</span>
                    <span>Client asset inspection for leaked API credentials or staging endpoints.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-[#60a5fa]">13.</span>
                    <span>Real-time threat evaluation without executing unverified client code.</span>
                  </li>
                </ul>

                <div>
                  <Link
                    to="/workspace"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-white/10 hover:bg-white text-white hover:text-black transition-all duration-200 text-xs font-mono tracking-wider uppercase font-medium border border-white/10"
                  >
                    START RECON SCAN →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Cards 02 & 03: Two Column Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 02: The Risk Explainer */}
            <div className="bento-animate opacity-0 translate-y-6 transition-all duration-700 ease-out delay-200 group relative rounded-2xl bg-gradient-to-br from-[#1B1D1E] to-[#141617] border border-white/[0.08] hover:border-white/20 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300">
              <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at top left, rgba(239, 68, 68, 0.12), transparent 60%)',
                }}
              />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono font-semibold text-rose-400 px-2 py-0.5 rounded bg-rose-950/40 border border-rose-800/40">
                      02 // TRANSLATOR
                    </span>
                    <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Plain English</span>
                  </div>

                  <h3 className="text-2xl font-light text-white mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    The Risk Explainer
                  </h3>

                  <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-6 font-light">
                    Translate security vulnerabilities into clear, plain-English impact statements.
                  </p>
                </div>

                {/* SVG Panel */}
                <div className="my-4 rounded-xl bg-[#0B0C0D] border border-white/10 p-5 font-mono text-xs text-white/70">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] text-white/40">
                    <span>SEVERITY INDEX</span>
                    <span className="text-rose-400">HIGH IMPACT</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span>API Exposure Risk</span>
                        <span className="text-rose-400">88%</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-rose-500 h-full w-[88%]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span>Database Policy Leak</span>
                        <span className="text-amber-400">62%</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full w-[62%]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <ul className="flex flex-col gap-2 mb-6 text-xs text-white/60 font-mono">
                    <li className="flex items-center gap-2">
                      <span className="text-rose-400">21.</span>
                      <span>Jargon-free risk breakdowns tailored for AI builders.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-rose-400">22.</span>
                      <span>Severity scoring and real-world exploit vector context.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-rose-400">23.</span>
                      <span>Instant context on how a flaw impacts user data.</span>
                    </li>
                  </ul>

                  <Link
                    to="/workspace/reports"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-white/10 hover:bg-white text-white hover:text-black transition-all duration-200 text-xs font-mono tracking-wider uppercase font-medium border border-white/10"
                  >
                    EXPLORE RISK REPORTS →
                  </Link>
                </div>
              </div>
            </div>

            {/* Card 03: The Prompt Fixer */}
            <div className="bento-animate opacity-0 translate-y-6 transition-all duration-700 ease-out delay-300 group relative rounded-2xl bg-gradient-to-br from-[#1B1D1E] to-[#141617] border border-white/[0.08] hover:border-white/20 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300">
              <div
                className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle at top left, rgba(16, 185, 129, 0.12), transparent 60%)',
                }}
              />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                      03 // FIX DOCTOR
                    </span>
                    <span className="text-xs font-mono text-white/50 uppercase tracking-wider">AI Prompt Generator</span>
                  </div>

                  <h3 className="text-2xl font-light text-white mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    The Prompt Fixer
                  </h3>

                  <p className="text-white/70 text-xs sm:text-sm leading-relaxed mb-6 font-light">
                    Generate tailored fix prompts to paste straight back into your AI editor.
                  </p>
                </div>

                {/* SVG Panel */}
                <div className="my-4 rounded-xl bg-[#0B0C0D] border border-white/10 p-5 font-mono text-xs text-white/80">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] text-white/40">
                    <span>PROMPT_PATCH // CURSOR & LOVABLE</span>
                    <span className="text-emerald-400">READY TO COPY</span>
                  </div>
                  <div className="mt-3 bg-black/40 p-2.5 rounded border border-white/5 text-[11px] leading-relaxed text-emerald-300">
                    <code>"Update server.ts route middleware to validate authorization token before processing..."</code>
                  </div>
                </div>

                <div>
                  <ul className="flex flex-col gap-2 mb-6 text-xs text-white/60 font-mono">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">31.</span>
                      <span>One-click copyable prompts for Cursor, Lovable, Bolt & v0.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">32.</span>
                      <span>Preserves your exact file architecture and style.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">33.</span>
                      <span>Includes verification tests to confirm fix success.</span>
                    </li>
                  </ul>

                  <Link
                    to="/workspace/action-plan"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-white/10 hover:bg-white text-white hover:text-black transition-all duration-200 text-xs font-mono tracking-wider uppercase font-medium border border-white/10"
                  >
                    GET FIX PROMPTS →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Card 04: Full Width Row (Continuous Hardening) */}
          <div className="bento-animate opacity-0 translate-y-6 transition-all duration-700 ease-out delay-400 group relative rounded-2xl bg-gradient-to-br from-[#1B1D1E] to-[#141617] border border-white/[0.08] hover:border-white/20 p-6 sm:p-8 lg:p-10 transition-all duration-300">
            <div
              className="absolute top-0 left-0 w-full h-full pointer-events-none rounded-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-500"
              style={{
                background: 'radial-gradient(circle at top left, rgba(168, 85, 247, 0.15), transparent 60%)',
              }}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
              {/* Copy on Left */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono font-semibold text-purple-400 px-2 py-0.5 rounded bg-purple-950/40 border border-purple-800/40">
                    04 // GUARD
                  </span>
                  <span className="text-xs font-mono text-white/50 uppercase tracking-wider">Continuous Hardening</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-light text-white mb-3" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                  Hardened Software
                </h3>

                <p className="text-white/70 text-sm sm:text-base leading-relaxed mb-6 font-light">
                  Keep your app locked down as you add features and prompt new iterations.
                </p>

                <ul className="flex flex-col gap-2.5 mb-8 text-xs sm:text-sm text-white/60 font-mono">
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">41.</span>
                    <span>Automated regression testing after every major AI prompt iteration.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">42.</span>
                    <span>Full visibility over client-side keys and database permission rules.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-purple-400">43.</span>
                    <span>Zero-friction workflow that keeps vibe coding fast and bulletproof.</span>
                  </li>
                </ul>

                <div>
                  <Link
                    to="/workspace"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded bg-white/10 hover:bg-white text-white hover:text-black transition-all duration-200 text-xs font-mono tracking-wider uppercase font-medium border border-white/10"
                  >
                    HARDEN YOUR APP →
                  </Link>
                </div>
              </div>

              {/* Panel SVG Illustration on Right */}
              <div className="lg:col-span-6 rounded-xl bg-[#0B0C0D] border border-white/10 p-6 flex flex-col justify-between min-h-[240px] relative overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono text-white/40 border-b border-white/10 pb-3 mb-4">
                  <span>HARDENING_SHIELD // REALTIME</span>
                  <span className="text-purple-400 font-semibold">● PROTECTED</span>
                </div>

                <div className="my-auto py-2 flex justify-center items-center">
                  <svg width="280" height="120" viewBox="0 0 280 120" fill="none" className="w-full max-w-[280px]">
                    <rect x="20" y="20" width="240" height="80" rx="8" fill="#141617" stroke="#ffffff" strokeOpacity="0.1" />
                    <path d="M140 35 L165 48 V72 L140 85 L115 72 V48 Z" stroke="#a855f7" strokeWidth="2" fill="#1B1D1E" />
                    <path d="M132 60 L138 66 L148 54" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="50" cy="60" r="4" fill="#a855f7" />
                    <path d="M54 60H115" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2" />
                    <circle cx="230" cy="60" r="4" fill="#a855f7" />
                    <path d="M165 60H226" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2" />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-white/50 pt-3 border-t border-white/10">
                  <span>STATUS: 0 VULNERABILITIES DETECTED</span>
                  <span className="text-purple-400">READY TO DEPLOY</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
