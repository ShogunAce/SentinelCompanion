import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { UrlForm } from './components';
import type { UrlFormProps } from './components';

const PAL = {
 sky0: '#f6f5f0', sky1: '#f5f4ef', sky2: '#eaecf1', water0: '#e6e9f2', water1: '#e1e5ef', water2: '#f5f4ef',
 halo: 'radial-gradient(circle at 50% 46%, rgba(255,255,255,.95) 0%, rgba(226,233,250,.75) 42%, rgba(226,233,250,0) 72%)',
 shadow: 'rgba(37,43,54,.06)',
};
// Trimmed artwork is 1980x1962; keep its ratio so the feet meet the waterline.
const BOT_ASPECT = 1962 / 1980;
const GRAIN = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;
const EASE = 'cubic-bezier(.33,.4,.4,1)';
const abs = (o: CSSProperties): CSSProperties => ({ position: 'absolute', ...o });

export function heroLayout(W: number, wide = W >= 900) {
 const D = wide ? Math.min(Math.max(W * .28, 300), 440) : Math.min(Math.max(W * .51, 170), 260);
 const padTop = wide ? 28 : 24;
 const cy = padTop + D / 2;
 // Match the shared container and reserve the rightmost column for the orb.
 const contentWidth = W > 1150 ? Math.min(1200, W - 96) : W - 64;
 const cx = wide ? (W + contentWidth - D) / 2 : W / 2;
 const copyWidth = wide ? contentWidth - D - 64 : contentWidth;
 const waterY = cy + D / 2 - 2;
 return { wide, D, padTop, cx, cy, copyWidth, waterY, emitY: waterY + .19 * D, rippleW: Math.max(W, 600), bw: wide ? 3 : 2 };
}
type Layout = ReturnType<typeof heroLayout>;

// The companion. Float and sway live on nested wrappers so the two cycles drift
// apart instead of looping in lockstep; the reflection reuses the same markup
// under a scaleY(-1), which mirrors that motion for free.
function Bot({ D, mirror, still }: { D: number; mirror: boolean; still: boolean }) {
 const h = D * BOT_ASPECT;
 return <>
  {!mirror && <div style={abs({ left: -.06 * D, top: -.02 * D, width: 1.12 * D, height: 1.12 * D, background: PAL.halo, animation: still ? 'none' : 'botHalo 7.4s ease-in-out infinite alternate' })}/>}
  <div style={abs({ left: 0, top: 0, width: D, height: D, animation: still ? 'none' : 'botFloat 6.2s ease-in-out infinite alternate' })}>
   <div style={abs({ left: 0, top: 0, width: D, height: D, transformOrigin: '50% 72%', animation: still ? 'none' : 'botSway 7.9s ease-in-out -2.6s infinite alternate' })}>
    <img
     src="/sentinel-bot-1024.webp"
     srcSet="/sentinel-bot-512.webp 512w, /sentinel-bot-1024.webp 1024w"
     sizes={`${Math.round(D)}px`}
     alt=""
     draggable={false}
     fetchPriority={mirror ? 'low' : 'high'}
     style={abs({ left: 0, top: D - h, width: D, height: h })}
    />
   </div>
  </div>
 </>;
}

function Scene({ W, H, L, still }: { W: number; H: number; L: Layout; still: boolean }) {
 const { D, cx, cy, waterY, emitY, rippleW: rw, bw } = L;
 const pct = (v: number) => `${(v / H * 100).toFixed(2)}%`;
 const s0 = .12 * W / rw;
 const ring = (key: string, extra: CSSProperties & Record<string, string | number>) => <div key={key} style={abs({ left: cx - rw / 2, top: emitY - waterY - rw / 16, width: rw, height: rw / 8, borderRadius: '50%', border: `${bw}px solid rgba(255,255,255,.92)`, boxShadow: `0 ${bw}px 0 ${PAL.shadow}, inset 0 -${bw}px 0 ${PAL.shadow}`, opacity: 0, '--s0': s0, ...extra } as CSSProperties)}/>;
 const rings: ReactNode[] = [];
 if (still) {
  [[.32, .55], [.46, .46], [.63, .36], [.84, .24]].forEach(([s, o], i) => rings.push(ring('s' + i, { transform: `scale(${s})`, opacity: o })));
 } else {
  for (let g = 0; g < 2; g++) for (let i = 0; i < 4; i++) rings.push(ring(`l${g}${i}`, { '--s1': 1 - .07 * i, '--o': .9 * (1 - .2 * i), animation: `rippleLoop 9s ${EASE} ${g * 4.5 + i * .25}s infinite` }));
 }
 const mask = 'linear-gradient(180deg,#000 0%,rgba(0,0,0,.55) 35%,transparent 80%)';
 return <div className="hero-scene" aria-hidden="true" style={abs({ inset: 0, overflow: 'hidden', pointerEvents: 'none' })}>
  {/* Water and reflection fade out behind the copy; the companion itself must not. */}
  <div className="hero-backdrop" style={abs({ inset: 0 })}>
   <div style={abs({ inset: 0, background: `linear-gradient(180deg, ${PAL.sky0} 0%, ${PAL.sky1} ${pct(waterY * .55)}, ${PAL.sky2} ${pct(waterY - 1)}, ${PAL.water0} ${pct(waterY)}, ${PAL.water1} ${pct(waterY + (H - waterY) * .5)}, ${PAL.water2} 100%)` })}/>
   <div style={abs({ left: 0, width: W, top: waterY - 8, height: 16, background: 'linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,.55), rgba(255,255,255,0))' })}/>
   <div style={abs({ left: 0, top: waterY, width: W, height: Math.max(H - waterY, 0), overflow: 'hidden', WebkitMaskImage: mask, maskImage: mask })}>
    <div style={abs({ inset: 0, transformOrigin: `${cx}px 0px`, animation: still ? 'none' : 'refShimmer 4.5s ease-in-out infinite' })}>
     <div style={abs({ inset: 0, filter: 'blur(14px)', opacity: .3 })}>
      <div style={abs({ left: cx - D / 2, top: (waterY - cy) - D / 2, width: D, height: D, transform: 'scaleY(-1)' })}><Bot D={D} mirror still={still}/></div>
     </div>
    </div>
   </div>
   <div style={abs({ left: 0, top: waterY, width: W, height: Math.max(H - waterY, 0), overflow: 'hidden' })}>{rings}</div>
  </div>
  <div style={abs({ left: cx - D / 2, top: cy - D / 2, width: D, height: D })}><Bot D={D} mirror={false} still={still}/></div>
  <div style={abs({ inset: 0, opacity: .035, backgroundImage: GRAIN, backgroundSize: '160px 160px', mixBlendMode: 'multiply' })}/>
 </div>;
}

function useStillMotion() {
 const [still, setStill] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
 useLayoutEffect(() => { const q = matchMedia('(prefers-reduced-motion: reduce)'); const on = () => setStill(q.matches); q.addEventListener('change', on); return () => q.removeEventListener('change', on); }, []);
 return still;
}

export default function Hero(props: UrlFormProps) {
 const ref = useRef<HTMLElement>(null);
 const [size, setSize] = useState({ W: 0, H: 0 });
 const still = useStillMotion();
 useLayoutEffect(() => {
  const el = ref.current; if (!el) return;
  const measure = () => setSize(s => { const W = Math.round(el.offsetWidth), H = Math.round(el.offsetHeight); return s.W === W && s.H === H ? s : { W, H }; });
  measure(); const ro = new ResizeObserver(measure); ro.observe(el, { box: 'border-box' }); return () => ro.disconnect();
 }, []);
 const L = heroLayout(size.W || 1280, matchMedia('(min-width: 900px)').matches);
 if (!L.wide && size.H) { L.cy = size.H - L.D / 2 - 36; L.waterY = L.cy + L.D / 2 - 2; L.emitY = L.waterY + .19 * L.D; }
 const textTop = L.padTop;
 return <section className="hero-stage" ref={ref} style={{ '--hero-orb-space': L.D + 64 + 'px', '--hero-top': `${textTop}px`, '--hero-copy-width': `${L.copyWidth}px` } as CSSProperties}>
  {size.W > 0 && <Scene W={size.W} H={size.H} L={L} still={still}/>}
  <div className="container hero-inner">
   <p className="hero-eyebrow"><span/>Your digital companion for vibecoded apps</p>
   <h1>You vibecoded the app.<br/>Let’s find & fix the<br/><em>security flaws.</em></h1>
   <p className="hero-copy">Sentinel spot-checks AI-generated code for cybersecurity vulnerabilities and logic flaws—explaining every risk in plain English and giving you exact fixes to prompt your builder.</p>
   <div className="hero-form"><UrlForm {...props} compact/></div>
  </div>
 </section>;
}






