import { useEffect, useRef } from 'react';
import LazyStage from '../three/LazyStage';
import type { CarConfig } from '../../lib/types';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const d = (s: number) => ({ animationDelay: `${s}s` });

// Scroll-Choreografie: Headline tritt zurück, Auto blendet ein und dreht sich mit.
export default function Hero({ config, model3d, title, href }: { config: CarConfig; model3d?: string; title: string; href: string }) {
  const sec = useRef<HTMLElement>(null), txt = useRef<HTMLDivElement>(null), car = useRef<HTMLDivElement>(null);
  const cap = useRef<HTMLDivElement>(null), hint = useRef<HTMLDivElement>(null), spin = useRef<number | null>(0);

  useEffect(() => {
    let raf = 0;
    const run = () => {
      const h = sec.current, t = txt.current, c = car.current, k = cap.current;
      if (!h || !t || !c || !k) return;
      const total = h.offsetHeight - window.innerHeight, p = clamp01(-h.getBoundingClientRect().top / Math.max(1, total));
      const f = clamp01((p - 0.12) / 0.22), g = clamp01((p - 0.22) / 0.3), q = clamp01((p - 0.62) / 0.25);
      t.style.opacity = String(1 - f); t.style.transform = `translateY(${-f * 80}px) scale(${1 - f * 0.12})`; t.style.pointerEvents = f > 0.5 ? 'none' : 'auto';
      c.style.opacity = String(g); c.style.transform = `scale(${0.78 + g * 0.22}) translateY(${(1 - g) * 60}px)`;
      k.style.opacity = String(q); k.style.transform = `translateY(${(1 - q) * 24}px)`;
      if (hint.current) { const near = t.getBoundingClientRect().bottom > window.innerHeight - 90; hint.current.style.opacity = near ? '0' : String(1 - clamp01(p / 0.1)); }
      spin.current = clamp01((p - 0.25) / 0.75) * Math.PI * 1.15;
    };
    const on = () => { if (document.hidden) return run(); if (raf) return; raf = requestAnimationFrame(() => { raf = 0; run(); }); };
    run();
    window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={sec} className="hero">
      <div className="hero-pin">
        <div ref={car} className="hero-car">
          <LazyStage config={config} model3d={model3d} spinRef={spin} />
        </div>
        <div ref={txt} className="hero-t">
          <div className="eyebrow up">G Performance</div>
          <h1 className="d-hero">
            <span className="up" style={{ display: 'block', ...d(0.08) }}>Dein Auto.</span>
            <span className="up" style={{ display: 'block', ...d(0.18) }}>Deine Teile.</span>
            <span className="up" style={{ display: 'block', color: 'var(--acc-ink)', ...d(0.28) }}>Handverlesen.</span>
          </h1>
          <p className="up" style={d(0.4)}>Jedes Teil in 3D direkt am Auto. Nur Shops, die wir selbst empfehlen.</p>
          <div className="hero-cta up" style={d(0.5)}>
            <a href="/fahrzeuge/" className="btn btn-ink">Fahrzeug wählen</a>
            <a href="#beliebt" className="btn btn-line">Builds ansehen</a>
          </div>
        </div>
        <div ref={cap} className="hero-cap">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="eyebrow">Build des Monats</span>
            <span className="name">{title}</span>
          </div>
          <a href={href} className="btn btn-ink">Diesen Build konfigurieren</a>
        </div>
        <div ref={hint} className="hero-hint" aria-hidden="true"><span>Scrollen</span><i /></div>
      </div>
    </section>
  );
}
