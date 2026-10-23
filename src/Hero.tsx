import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateUrl } from './components';
import type { UrlFormProps } from './components';

export default function Hero({
  value,
  onChange,
  onSubmitScan,
  isScanning = false,
}: UrlFormProps) {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const companionRef = useRef<HTMLDivElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState('');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Video autoplay & loop setup via JavaScript (as specified to prevent browser drops)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (prefersReducedMotion) {
      video.pause();
      try {
        video.currentTime = 0;
      } catch {
        // ignore if not ready
      }
      return;
    }

    video.muted = true;
    video.loop = true;
    video.playsInline = true;

    const onCanPlay = () => {
      setVideoReady(true);
    };

    video.addEventListener('canplay', onCanPlay, { once: true });
    video.play().catch(() => {
      // Autoplay fallback silently handled
    });

    return () => {
      video.removeEventListener('canplay', onCanPlay);
    };
  }, [prefersReducedMotion]);

  // Cursor tracking for companion mascot (subtle gaze lead)
  useEffect(() => {
    if (prefersReducedMotion) return;
    const isTouch =
      typeof window !== 'undefined' &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (isTouch) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId: number | null = null;
    let idleTimer: any = null;

    let centerX = 0;
    let centerY = 0;

    const measureCenter = () => {
      if (!companionRef.current) return;
      const rect = companionRef.current.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
    };

    measureCenter();
    window.addEventListener('resize', measureCenter, { passive: true });
    window.addEventListener('scroll', measureCenter, { passive: true });

    const applyLook = (x: number, y: number) => {
      if (companionRef.current) {
        companionRef.current.style.setProperty('--look-x', x.toFixed(4));
        companionRef.current.style.setProperty('--look-y', y.toFixed(4));
      }
    };

    const loop = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      if (Math.abs(targetX - currentX) < 0.001 && Math.abs(targetY - currentY) < 0.001) {
        currentX = targetX;
        currentY = targetY;
        applyLook(currentX, currentY);
        rafId = null;
        return;
      }

      applyLook(currentX, currentY);
      rafId = requestAnimationFrame(loop);
    };

    const startLoop = () => {
      if (rafId === null) rafId = requestAnimationFrame(loop);
    };

    const onPointerMove = (e: PointerEvent) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const clampedX = Math.max(-1, Math.min(1, dx / (vw * 0.5)));
      const clampedY = Math.max(-1, Math.min(1, dy / (vh * 0.5)));

      targetX = clampedX * 0.8;
      targetY = clampedY * 0.8;
      startLoop();

      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        targetX = 0;
        targetY = 0;
        startLoop();
      }, 2500);
    };

    const onPointerLeave = () => {
      clearTimeout(idleTimer);
      targetX = 0;
      targetY = 0;
      startLoop();
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('mouseleave', onPointerLeave);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('mouseleave', onPointerLeave);
      window.removeEventListener('resize', measureCenter);
      window.removeEventListener('scroll', measureCenter);
      if (rafId !== null) cancelAnimationFrame(rafId);
      clearTimeout(idleTimer);
    };
  }, [prefersReducedMotion]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = validateUrl(value || '');
    if (err) {
      setError(err);
      return;
    }
    setError('');

    if (onSubmitScan && value?.trim()) {
      onSubmitScan(value.trim());
    } else {
      navigate('/workspace/new-scan');
    }
  };

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden bg-[#F5F2EC] text-[#141414] select-none min-h-[640px] sm:min-h-[780px] lg:min-h-[880px]"
      style={{
        fontFamily: "'Poppins', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Daylight Orbit Embedded CSS Styles and Animations */}
      <style>{`
        @keyframes daylightRise {
          from {
            opacity: 0;
            transform: translateY(26px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes daylightBob {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-14px);
          }
        }
        @keyframes daylightChipIn {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes daylightDotDrop {
          0% {
            opacity: 0;
            transform: translateY(0);
          }
          25% {
            opacity: 1;
          }
          75% {
            opacity: 1;
            transform: translateY(10px);
          }
          100% {
            opacity: 0;
            transform: translateY(12px);
          }
        }
        .orbit-rise-pill {
          animation: daylightRise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
        }
        .orbit-rise-h1-1 {
          animation: daylightRise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.22s both;
        }
        .orbit-rise-h1-2 {
          animation: daylightRise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.30s both;
        }
        .orbit-rise-h1-3 {
          animation: daylightRise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.38s both;
        }
        .orbit-rise-body {
          animation: daylightRise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.50s both;
        }
        .orbit-rise-cta {
          animation: daylightRise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.62s both;
        }
        .orbit-mascot-fade {
          animation: daylightRise 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.45s both;
        }
        .orbit-mascot-bob {
          animation: daylightBob 7s ease-in-out infinite;
        }
        .orbit-chip-1 {
          animation: daylightChipIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.90s both;
        }
        .orbit-chip-2 {
          animation: daylightChipIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.05s both;
        }
        .orbit-chip-3 {
          animation: daylightChipIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1.20s both;
        }
        .orbit-scroll-hint {
          animation: daylightRise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 1.30s both;
        }
        .orbit-dot-drop {
          animation: daylightDotDrop 1.9s infinite ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .orbit-rise-pill,
          .orbit-rise-h1-1,
          .orbit-rise-h1-2,
          .orbit-rise-h1-3,
          .orbit-rise-body,
          .orbit-rise-cta,
          .orbit-mascot-fade,
          .orbit-mascot-bob,
          .orbit-chip-1,
          .orbit-chip-2,
          .orbit-chip-3,
          .orbit-scroll-hint,
          .orbit-dot-drop {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* Background Soft Glows (behind the plate) */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(44% 34% at 50% 58%, rgba(31,59,214,0.16), transparent 70%),
            radial-gradient(40% 30% at 32% 52%, rgba(247,166,166,0.22), transparent 72%)
          `,
        }}
        aria-hidden="true"
      />

      {/* Globe Plate (receptive to mobile screen scaling, centered, sitting below bottom) */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-0 w-[1100px] sm:w-[1500px] h-[1000px] sm:h-[1360px] bottom-[-300px] sm:bottom-[-420px]"
        style={{
          WebkitMaskImage: 'radial-gradient(120% 86% at 50% 86%, #000 45%, transparent 82%)',
          maskImage: 'radial-gradient(120% 86% at 50% 86%, #000 45%, transparent 82%)',
        }}
        aria-hidden="true"
      >
        {/* Globe Still Image */}
        <img
          src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: 'invert(1) hue-rotate(168deg) saturate(1.2) contrast(1.3) brightness(1.03)',
            mixBlendMode: 'multiply',
            opacity: 0.76,
          }}
        />

        {/* Globe Rotating Video (looping seamless 4s rotation) */}
        <video
          ref={videoRef}
          src="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e71aea27-a808-4ae3-8231-a469d49285d4.mp4"
          muted
          loop
          playsInline
          autoPlay
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{
            filter: 'invert(1) hue-rotate(168deg) saturate(1.2) contrast(1.3) brightness(1.03)',
            mixBlendMode: 'multiply',
            opacity: prefersReducedMotion ? 0 : videoReady ? 0.76 : 0,
          }}
        />
      </div>

      {/* Thin Straight Light Lines across the scene */}
      {/* 1. Upper-left at 22° in rgba(31,59,214,.35) */}
      <div
        className="pointer-events-none absolute top-[14%] left-[-10%] w-[580px] h-[1px] z-1 hidden sm:block"
        style={{
          transform: 'rotate(22deg)',
          background: 'linear-gradient(90deg, transparent 0%, rgba(31,59,214,0.35) 50%, transparent 100%)',
        }}
        aria-hidden="true"
      />
      {/* 2. Upper-right at -19° in rgba(247,166,166,.75) */}
      <div
        className="pointer-events-none absolute top-[18%] right-[-6%] w-[680px] h-[1px] z-1 hidden sm:block"
        style={{
          transform: 'rotate(-19deg)',
          background: 'linear-gradient(90deg, transparent 0%, rgba(247,166,166,0.75) 50%, transparent 100%)',
        }}
        aria-hidden="true"
      />
      {/* 3. Lower-left at -8° in rgba(20,20,20,.14) */}
      <div
        className="pointer-events-none absolute bottom-[22%] left-[-4%] w-[620px] h-[1px] z-1 hidden sm:block"
        style={{
          transform: 'rotate(-8deg)',
          background: 'linear-gradient(90deg, transparent 0%, rgba(20,20,20,0.14) 50%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Main Hero Container */}
      <div className="relative z-10 w-full max-w-[1360px] mx-auto px-4 xs:px-6 sm:px-12 pt-[36px] sm:pt-[54px] lg:pt-[62px] pb-[70px] sm:pb-[100px]">
        {/* Two-Column Grid: minmax(0,1fr) and 560px, 40px gap */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_560px] gap-8 sm:gap-12 items-center">
          
          {/* Left Column: Glass pill, Headline, Body, App URL field group */}
          <div className="flex flex-col items-start max-w-[680px] w-full">
            {/* Glass Pill: responsive typography & padding to prevent overflow on mobile */}
            <div
              className="orbit-rise-pill inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full mb-5 sm:mb-6 max-w-full overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.62)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(20, 20, 20, 0.1)',
                boxShadow: '0 2px 10px rgba(20, 20, 20, 0.04)',
              }}
            >
              <span
                className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] rounded-full bg-[#1F3BD6] text-white flex items-center justify-center font-bold text-[10px] sm:text-[11px] leading-none shrink-0"
              >
                S
              </span>
              <span
                className="text-[9.5px] sm:text-[11.5px] font-medium tracking-[0.08em] sm:tracking-[0.16em] uppercase text-[#141414] truncate"
              >
                YOUR DIGITAL COMPANION FOR VIBECODED APPS
              </span>
            </div>

            {/* Headline: fluid clamp typography ensuring zero overflow on narrow screens */}
            <h1
              className="text-[#141414] font-light leading-[1.12] mb-5 sm:mb-6 break-words"
              style={{
                fontSize: 'clamp(28px, 6.4vw, 66px)',
                letterSpacing: '-1.4px',
              }}
            >
              <span className="orbit-rise-h1-1 block">
                You vibecoded the app.
              </span>
              <span className="orbit-rise-h1-2 block">
                Let's find & fix the
              </span>
              <span
                className="orbit-rise-h1-3 inline-block font-normal not-italic"
                style={{
                  fontFamily: "'Instrument Serif', Georgia, serif",
                  fontStyle: 'italic',
                  fontSize: '1.09em',
                  background: 'linear-gradient(95deg, #E58FA8 0%, #1F3BD6 38%, #1F3BD6 66%, #A48BE0 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                security flaws.
              </span>
            </h1>

            {/* Body Copy: max-width 620px, 17px/1.75, ink @66% */}
            <p
              className="orbit-rise-body text-[14.5px] sm:text-[17px] leading-[1.65] sm:leading-[1.75] mb-6 sm:mb-8"
              style={{
                color: 'rgba(20, 20, 20, 0.66)',
                maxWidth: '620px',
              }}
            >
              Sentinel spot-checks AI-generated code for cybersecurity vulnerabilities and logic flaws—explaining every risk in plain English and giving you exact fixes to prompt your builder.
            </p>

            {/* App URL Field Group: 12px-radius glass input next to #1F3BD6 Open workspace button */}
            <form
              onSubmit={handleSubmit}
              className="orbit-rise-cta w-full max-w-[560px] flex flex-col gap-2"
              noValidate
            >
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full">
                <input
                  type="url"
                  placeholder="https://your-app.com"
                  value={value || ''}
                  onChange={(e) => {
                    onChange(e.target.value);
                    if (error) setError('');
                  }}
                  className="flex-1 w-full px-4 py-3 text-[14px] sm:text-[15px] text-[#141414] placeholder-[#141414]/40 outline-none transition-all duration-200"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: error ? '1.5px solid #a3322f' : '1px solid rgba(20, 20, 20, 0.14)',
                    borderRadius: '12px',
                    height: '48px',
                  }}
                  aria-label="App URL"
                />

                <button
                  type="submit"
                  disabled={isScanning}
                  className="w-full sm:w-auto px-6 py-3 rounded-[12px] bg-[#1F3BD6] hover:bg-[#1932ba] text-white font-medium text-[14px] flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 cursor-pointer shrink-0"
                  style={{
                    boxShadow: '0 10px 26px rgba(31, 59, 214, 0.28)',
                    height: '48px',
                  }}
                >
                  <span>{isScanning ? 'Scanning...' : 'Open workspace →'}</span>
                </button>
              </div>

              {error && (
                <p className="text-[#a3322f] text-xs mt-1 font-medium" role="alert">
                  {error}
                </p>
              )}
            </form>
          </div>

          {/* Right Column: 3D Robot Mascot + 3 Glass Chips */}
          <div className="orbit-mascot-fade relative w-full flex justify-center items-center lg:justify-end min-h-[300px] sm:min-h-[460px] lg:min-h-[620px] mb-8 lg:mb-0">
            {/* Mascot Wrapper with slow 7s bob loop & cursor look tracking */}
            <div
              ref={companionRef}
              className="orbit-mascot-bob relative flex items-center justify-center max-w-full"
              style={{
                transform:
                  'translate(calc(var(--look-x, 0) * 8px), calc(var(--look-y, 0) * 8px)) rotate(calc(var(--look-x, 0) * 1.5deg))',
                willChange: 'transform',
              }}
            >
              {/* Mascot image with 0 26px 38px drop shadow */}
              <img
                src="/sentinel-bot.png"
                srcSet="/sentinel-bot-512.webp 512w, /sentinel-bot-1024.webp 1024w, /sentinel-bot.png 1024w"
                sizes="(max-width: 600px) 280px, (max-width: 1024px) 440px, 620px"
                alt="Sentinel 3D robot companion"
                className="w-auto h-[260px] xs:h-[320px] sm:h-[440px] lg:h-[620px] max-w-full object-contain pointer-events-none select-none"
                style={{
                  filter: 'drop-shadow(0 26px 38px rgba(20, 20, 20, 0.14))',
                }}
                draggable={false}
              />

              {/* Glass Chip 1: "XSS" (blue text, upper-left) */}
              <div
                className="orbit-chip-1 absolute top-[12%] sm:top-[16%] left-[2%] sm:left-[6%] w-[42px] h-[42px] sm:w-[54px] sm:h-[54px] rounded-full flex items-center justify-center select-none"
                style={{
                  background: 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(20, 20, 20, 0.1)',
                  boxShadow: '0 6px 18px rgba(20, 20, 20, 0.08)',
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#1F3BD6',
                }}
              >
                XSS
              </div>

              {/* Glass Chip 2: "JWT" (pink text, top-right) */}
              <div
                className="orbit-chip-2 absolute top-[8%] sm:top-[12%] right-[2%] sm:right-[8%] w-[38px] h-[38px] sm:w-[48px] sm:h-[48px] rounded-full flex items-center justify-center select-none"
                style={{
                  background: 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(20, 20, 20, 0.1)',
                  boxShadow: '0 6px 18px rgba(20, 20, 20, 0.08)',
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: '#E07A7A',
                }}
              >
                JWT
              </div>

              {/* Glass Chip 3: "SQLi" (ink text, lower-right) */}
              <div
                className="orbit-chip-3 absolute bottom-[14%] sm:bottom-[18%] right-[2%] sm:right-[6%] w-[44px] h-[44px] sm:w-[58px] sm:h-[58px] rounded-full flex items-center justify-center select-none"
                style={{
                  background: 'rgba(255, 255, 255, 0.65)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(20, 20, 20, 0.1)',
                  boxShadow: '0 6px 18px rgba(20, 20, 20, 0.08)',
                  fontFamily: 'ui-monospace, Menlo, monospace',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#141414',
                }}
              >
                SQLi
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Hint (Bottom Centre):
            24×38 rounded outline capsule with 4×7 blue dot falling inside,
            flanked by two small SVGs with curved "SCAN" and "FIX" labels on arc */}
        <div className="orbit-scroll-hint pt-4 sm:pt-0 sm:absolute sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 flex items-center justify-center gap-2.5 sm:gap-3 pointer-events-none select-none">
          {/* Curved "SCAN" SVG */}
          <svg width="42" height="22" viewBox="0 0 90 45" className="overflow-visible">
            <path id="arc-scan" d="M4 40 A 41 41 0 0 1 86 40" fill="none" />
            <text
              fill="rgba(20,20,20,0.42)"
              fontFamily="ui-monospace, Menlo, monospace"
              fontSize="10"
              letterSpacing="0.22em"
            >
              <textPath href="#arc-scan" startOffset="50%" textAnchor="middle">
                SCAN
              </textPath>
            </text>
          </svg>

          {/* 24x38 Capsule with dotdrop animation */}
          <div
            className="w-[22px] sm:w-[24px] h-[34px] sm:h-[38px] rounded-full flex justify-center pt-1 sm:pt-1.5"
            style={{
              border: '1.5px solid rgba(20, 20, 20, 0.22)',
            }}
          >
            <div
              className="orbit-dot-drop w-[3.5px] sm:w-[4px] h-[6px] sm:h-[7px] rounded-full bg-[#1F3BD6]"
            />
          </div>

          {/* Curved "FIX" SVG */}
          <svg width="42" height="22" viewBox="0 0 90 45" className="overflow-visible">
            <path id="arc-fix" d="M4 40 A 41 41 0 0 1 86 40" fill="none" />
            <text
              fill="rgba(20,20,20,0.42)"
              fontFamily="ui-monospace, Menlo, monospace"
              fontSize="10"
              letterSpacing="0.22em"
            >
              <textPath href="#arc-fix" startOffset="50%" textAnchor="middle">
                FIX
              </textPath>
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
}
