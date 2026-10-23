import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateUrl } from './components';
import type { UrlFormProps } from './components';
import { GLOBE_IMG, GLOBE_VIDEO } from './landingBits';

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
    <section id="hero" className="lp-hero">
      <div className="hero-glow" aria-hidden="true" />
      <div className="globe" aria-hidden="true">
        <img src={GLOBE_IMG} alt="" />
        <video
          ref={videoRef}
          src={GLOBE_VIDEO}
          muted
          loop
          playsInline
          autoPlay
          className={!prefersReducedMotion && videoReady ? 'ready' : undefined}
        />
      </div>
      <i className="beam b1" aria-hidden="true" />
      <i className="beam b2" aria-hidden="true" />
      <i className="beam b3" aria-hidden="true" />

      <div className="wrap">
        <div className="hero-grid">
          <div>
            <div className="pill glass r1"><b>S</b><span>Your cybersecurity companion for vibecoded apps</span></div>
            <h1>
              <span className="r2">You vibecoded the app.</span>
              <span className="r3">Let's find &amp; fix the</span>
              <span className="r4"><em>security flaws.</em></span>
            </h1>
            <p className="body r5">
              Sentinel spot-checks AI-generated code for cybersecurity vulnerabilities and logic flaws, explaining every risk in plain English and giving you exact fixes to prompt your builder.
            </p>
            <form className="url-form r6" onSubmit={handleSubmit} noValidate>
              <label className="url-field">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></svg>
                <input
                  type="url"
                  placeholder="https://your-app.com"
                  value={value || ''}
                  onChange={(e) => {
                    onChange(e.target.value);
                    if (error) setError('');
                  }}
                  aria-label="App URL"
                  aria-invalid={!!error}
                />
              </label>
              <button className="btn btn-navy" type="submit" disabled={isScanning}>
                {isScanning ? 'Scanning…' : <>Open workspace <span aria-hidden="true">→</span></>}
              </button>
            </form>
            <p className="form-note r6" role="alert">{error}</p>
            <div className="trust r6"><span>Plain English</span><span>Passive &amp; polite</span><span>Copy-paste fixes</span></div>
          </div>

          <div className="mascot-col rm">
            <div className="mascot" ref={companionRef}>
              <div className="mascot-bob">
                <img
                  src="/sentinel-bot-1024.webp"
                  srcSet="/sentinel-bot-512.webp 512w, /sentinel-bot-1024.webp 1024w"
                  sizes="(max-width: 640px) 290px, (max-width: 1100px) 440px, 620px"
                  alt="Sentinel 3D robot companion"
                  draggable={false}
                />
                <div className="chip glass c1">XSS</div>
                <div className="chip glass c2">JWT</div>
                <div className="chip glass c3">SQLi</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-hint" aria-hidden="true">
        <svg viewBox="0 0 90 45"><path id="arc-scan" d="M4 40 A 41 41 0 0 1 86 40" fill="none" /><text fill="rgba(20,20,20,.42)" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="2.2"><textPath href="#arc-scan" startOffset="50%" textAnchor="middle">SCAN</textPath></text></svg>
        <div className="capsule"><i /></div>
        <svg viewBox="0 0 90 45"><path id="arc-fix" d="M4 40 A 41 41 0 0 1 86 40" fill="none" /><text fill="rgba(20,20,20,.42)" fontFamily="JetBrains Mono, monospace" fontSize="10" letterSpacing="2.2"><textPath href="#arc-fix" startOffset="50%" textAnchor="middle">FIX</textPath></text></svg>
      </div>
    </section>
  );
}
