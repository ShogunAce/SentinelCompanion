import { useEffect } from 'react';
import type { RefObject } from 'react';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Scroll motion for the landing page: one-time reveals (90ms stagger, headline words first),
 * SVG draw-ins, the nav progress bar, active nav link, and light parallax on the hero and
 * colour bands. Everything is skipped under prefers-reduced-motion.
 */
export function useLandingMotion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const html = document.documentElement;
    const cleanups: Array<() => void> = [];

    /* ---------- Reveal ---------- */
    if (reduce) {
      root.querySelectorAll('[data-draw]').forEach(c => c.classList.add('drawn'));
    } else {
      html.classList.add('lp-motion');
      cleanups.push(() => html.classList.remove('lp-motion'));
      root.querySelectorAll<HTMLElement>('[data-words] .w').forEach(w => { w.style.opacity = '0'; });

      const reveal = (el: HTMLElement, delay: number) => {
        window.setTimeout(() => el.classList.add('in'), delay);
        const a = el.animate(
          [{ opacity: 0, transform: 'translateY(26px)' }, { opacity: 1, transform: 'none' }],
          { duration: 900, delay, easing: EASE, fill: 'both' },
        );
        a.onfinish = () => { el.style.opacity = '1'; a.cancel(); };
      };
      const io = new IntersectionObserver(entries => {
        let i = 0;
        entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => Number(b.target.hasAttribute('data-words')) - Number(a.target.hasAttribute('data-words')))
          .forEach(e => {
            const el = e.target as HTMLElement;
            io.unobserve(el);
            if (el.hasAttribute('data-words')) {
              el.querySelectorAll<HTMLElement>('.w').forEach((w, k) => reveal(w, k * 60));
              i += 2;
            } else {
              reveal(el, i * 90);
              i++;
              if (el.hasAttribute('data-draw')) window.setTimeout(() => el.classList.add('drawn'), 200 + i * 90);
            }
          });
      }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
      root.querySelectorAll('[data-reveal], [data-words]').forEach(t => io.observe(t));
      cleanups.push(() => io.disconnect());
    }

    /* ---------- Scroll-linked ---------- */
    const bar = root.querySelector<HTMLElement>('[data-progress]');
    const bands = Array.from(root.querySelectorAll<HTMLElement>('.band'));
    const heroGlobe = root.querySelector<HTMLElement>('.lp-hero .globe');
    const heroMascot = root.querySelector<HTMLElement>('.mascot-col');
    const endGlobe = root.querySelector<HTMLElement>('.end .globe');
    let ticking = false;
    const onScroll = () => {
      ticking = false;
      const y = window.scrollY, vh = window.innerHeight;
      const max = document.documentElement.scrollHeight - vh;
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      if (reduce) return;
      if (y < vh * 1.4) {
        if (heroGlobe) heroGlobe.style.translate = `0 ${y * 0.18}px`;
        if (heroMascot) heroMascot.style.translate = `0 ${y * -0.08}px`;
      }
      bands.forEach(b => {
        const p = Math.min(1, Math.max(0, (vh - b.getBoundingClientRect().top) / (vh * 0.45)));
        b.style.translate = `0 ${(1 - p) * 34}px`;
      });
      if (endGlobe?.parentElement) {
        const ep = Math.min(1, Math.max(0, (vh - endGlobe.parentElement.getBoundingClientRect().top) / (vh * 1.1)));
        endGlobe.style.translate = `0 ${(1 - ep) * 160}px`;
      }
    };
    const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    onScroll();
    cleanups.push(() => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); });

    /* ---------- Active nav link ---------- */
    const links = new Map<string, HTMLAnchorElement>();
    root.querySelectorAll<HTMLAnchorElement>('.nav-links a[href^="#"]').forEach(a => links.set(a.getAttribute('href')!.slice(1), a));
    const navIO = new IntersectionObserver(entries => entries.forEach(e => {
      const link = links.get(e.target.id);
      if (link && e.isIntersecting) { links.forEach(l => l.classList.remove('is-active')); link.classList.add('is-active'); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach((_, id) => { const el = document.getElementById(id); if (el) navIO.observe(el); });
    cleanups.push(() => navIO.disconnect());

    return () => cleanups.forEach(fn => fn());
  }, [rootRef]);
}
