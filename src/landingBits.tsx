import type { ReactNode } from 'react';

/** Splits plain text into word spans the landing motion hook can rise one by one. */
export function Words({ children }: { children: string }) {
  const parts = children.split(/(\s+)/);
  return <>{parts.map((p, i) => (/^\s+$/.test(p) || !p ? p : <span className="w" key={i}>{p}</span>))}</>;
}

/** Gradient serif accent kept as one unit so the gradient survives the word animation. */
export function Accent({ children }: { children: ReactNode }) {
  return <span className="w"><em>{children}</em></span>;
}

export function ShieldMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3 20 6v6c0 5-5 8-8 10-3-2-8-5-8-10V6z" /><path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

export const GLOBE_IMG = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/f1631235-0a76-464d-8f1d-2c4b48a997d5.jpg';
export const GLOBE_VIDEO = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e71aea27-a808-4ae3-8231-a469d49285d4.mp4';
