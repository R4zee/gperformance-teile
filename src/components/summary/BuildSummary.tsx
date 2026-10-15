import { useEffect, useMemo, useState } from 'react';
import LazyStage from '../three/LazyStage';
import { store, useStore } from '../../lib/store';
import { CATS, carConfig, eur, goHref, priceLabel, type Build, type VehicleCatalog } from '../../lib/types';

export default function BuildSummary({ cat: V }: { cat: VehicleCatalog }) {
  const { vehicle, builds } = useStore();
  const [copied, setCopied] = useState(false);

  // Geteilter Link: /bmw/m4/f82/build/#b=teil-a,teil-b&m=motor
  useEffect(() => {
    const h = new URLSearchParams(location.hash.slice(1)), ids = h.get('b');
    if (ids != null) {
      const b: Build = {};
      ids.split(',').forEach(id => { const p = V.parts.find(x => x.id === id || x.slug === id); if (p && !p.stock) b[p.cat] = p.id; });
      store.setBuild(V.key, b);
    }
    const m = h.get('m'), e = V.gen.engines.find(x => x.slug === m) || (store.get().vehicle?.key === V.key ? null : V.gen.engines[0]);
    if (e) store.setVehicle({ key: V.key, engine: e.slug, label: `${V.make.name} ${V.model.name} ${V.gen.name} · ${e.ps}` });
  }, [V]);

  const build = builds[V.key] || {};
  const engine = V.gen.engines.find(e => e.slug === (vehicle?.key === V.key ? vehicle.engine : '')) || V.gen.engines[0];
  const config = useMemo(() => carConfig(V, build), [V, build]);
  const rows = CATS.map((c, i) => {
    const p = V.parts.find(x => x.id === build[c.id] && !x.stock);
    return { i: '0' + (i + 1), cat: c.name, p };
  });
  const chosen = rows.filter(r => r.p).map(r => r.p!);
  const total = chosen.reduce((a, p) => a + (p.price || 0), 0);
  const countLabel = chosen.length === 1 ? '1 Teil' : `${chosen.length} Teile`;

  const share = () => {
    const u = `${location.origin}/${V.key}/build/#b=${chosen.map(p => p.id).join(',')}&m=${engine.slug}`;
    (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="wrap sum-in">
      <div className="sum-head">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span className="eyebrow">Dein Build</span>
          <h1 className="d-page">{V.make.name} {V.model.name} {V.gen.name}</h1>
          <span style={{ fontSize: 13, letterSpacing: '.06em', color: 'var(--mute2)' }}>{V.gen.meta} · {engine.name} · {engine.ps}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a href={`/${V.key}/`} className="btn btn-sm btn-line">Weiter bearbeiten</a>
          <button type="button" className="btn btn-sm btn-ink" onClick={share}>{copied ? 'Link kopiert' : 'Link teilen'}</button>
        </div>
      </div>
      <div className="sum-grid">
        <div className="sum-car"><LazyStage config={config} model3d={V.gen.model3d} autorotate /></div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {rows.map(r => (
            <div key={r.cat} className="sum-row">
              <span className="i">{r.i}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                <span className="c">{r.cat}</span>
                <span className="l" style={{ fontWeight: r.p ? 800 : 600, color: r.p ? 'var(--ink)' : 'var(--mute)' }}>{r.p ? `${r.p.brand} ${r.p.name}` : 'Serie'}</span>
              </div>
              <div className="r">
                <span className="p">{r.p ? priceLabel(r.p) : '—'}</span>
                {r.p && (r.p.hasLink
                  ? <a href={goHref(r.p)} target="_blank" rel="sponsored nofollow noopener" className="chip">{r.p.shop}*</a>
                  : <span className="chip off">{r.p.shop}</span>)}
              </div>
            </div>
          ))}
          <div className="sum-total"><span>Gesamt · {countLabel}</span><span>{eur(total)}</span></div>
          <p className="fine" suppressHydrationWarning>*Affiliate-Links. Kaufst du darüber, erhalten wir eine Provision. Für dich ändert sich der Preis nicht. Preise inkl. MwSt., Stand {new Date().toLocaleDateString('de-DE')}. Montage und Eintragung nicht enthalten.</p>
        </div>
      </div>
    </div>
  );
}
