import { useEffect, useMemo, useState } from 'react';
import LazyStage from '../three/LazyStage';
import { store, useStore } from '../../lib/store';
import { CATS, carConfig, eur, goHref, partPath, priceLabel, type CatId, type Part, type VehicleCatalog, type Zone } from '../../lib/types';
import './configurator.css';

type Props = { cat: VehicleCatalog; initialCat?: CatId; initialPart?: string };

export default function Configurator({ cat: V, initialCat, initialPart }: Props) {
  const { vehicle, builds } = useStore();
  const [active, setActive] = useState<CatId>(initialCat || 'felgen');
  const [zone, setZone] = useState<Zone>(initialCat || 'overview');
  const [detail, setDetail] = useState<string | null>(initialPart || null);
  const [view, setView] = useState<'v3d' | 'vlist'>('v3d');
  const [sort, setSort] = useState<'pick' | 'asc' | 'desc'>('pick');

  // Fahrzeug merken (für Header & Startseite). Motor: gespeichert → ?motor= → erster.
  const slug = vehicle?.key === V.key ? vehicle.engine : null;
  const engine = V.gen.engines.find(e => e.slug === slug) || V.gen.engines[0];
  useEffect(() => {
    const s = store.get(), q = new URLSearchParams(location.search).get('motor');
    const e = V.gen.engines.find(x => x.slug === q) || (s.vehicle?.key === V.key ? null : V.gen.engines[0]);
    if (e) store.setVehicle({ key: V.key, engine: e.slug, label: `${V.make.name} ${V.model.name} ${V.gen.name} · ${e.ps}` });
    if (initialPart) { const p = V.parts.find(x => x.id === initialPart); if (p) store.setPart(V.key, p.cat, p.stock ? null : p.id); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // URL mitführen, damit Links/Teilen/Zurück zur Ansicht passen.
  useEffect(() => {
    const dp = V.parts.find(p => p.id === detail);
    const path = dp ? partPath(V.key, dp) : zone === 'overview' && active === 'felgen' ? `/${V.key}/` : `/${V.key}/${active}/`;
    if (location.pathname !== path) history.replaceState(null, '', path + location.search);
  }, [active, detail, zone, V]);

  const build = builds[V.key] || {};
  const chosenId = (c: CatId) => build[c] || V.parts.find(p => p.cat === c && p.stock)?.id;
  const chosen = V.parts.filter(p => !p.stock && build[p.cat] === p.id);
  const total = chosen.reduce((a, p) => a + (p.price || 0), 0);
  const countLabel = chosen.length === 1 ? '1 Teil' : `${chosen.length} Teile`;
  const totalLabel = eur(total);
  const title = `${V.make.name} ${V.model.name} ${V.gen.name}`;
  const sub = `${V.gen.meta} · ${engine.name} · ${engine.ps}`;
  const config = useMemo(() => carConfig(V, build), [V, build]);

  const actCat = CATS.find(c => c.id === active)!, actIdx = '0' + (CATS.indexOf(actCat) + 1);
  const catParts = V.parts.filter(p => p.cat === active);
  const listParts = useMemo(() => {
    const l = catParts.slice();
    if (sort === 'asc') l.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sort === 'desc') l.sort((a, b) => (b.price || 0) - (a.price || 0));
    if (sort === 'pick') l.sort((a, b) => Number(b.pick) - Number(a.pick));
    return l;
  }, [catParts, sort]);

  const pickCat = (c: CatId, fromCar?: boolean) => { setActive(c); setZone(c); setDetail(null); if (fromCar) setView('v3d'); };
  const choose = (p: Part) => { store.setPart(V.key, p.cat, p.stock ? null : p.id); setDetail(p.id); setZone(p.cat); };

  const dp = V.parts.find(p => p.id === detail) || (view === 'vlist' ? listParts[0] : undefined);
  const showDetail = !!dp;
  const stockOf = (c: CatId) => V.parts.find(p => p.cat === c && p.stock);

  return (
    <main className={`cfg${view === 'vlist' ? ' is-list' : ''}`}>
      <aside className="cfg-side">
        <div className="cfg-veh desk">
          <h1>{title}</h1>
          <div className="sub">{sub}</div>
          <a href="/fahrzeuge/" className="cfg-switch">Wechseln</a>
        </div>
        <nav className="cfg-cats" aria-label="Kategorien">
          {CATS.map((c, i) => {
            const p = V.parts.find(x => x.id === chosenId(c.id)), on = c.id === active, changed = !!p && !p.stock;
            return (
              <button key={c.id} type="button" className={`cfg-cat${on ? ' on' : ''}`} onClick={() => pickCat(c.id)}>
                <span className="idx">0{i + 1}</span>
                <span className="txt">
                  <span className="nm">{c.name}</span>
                  <span className="sb desk">{!p || p.stock ? 'Serie' : p.brand}</span>
                </span>
                {changed && <span className="dot" />}
              </button>
            );
          })}
        </nav>
        <div className="cfg-tot desk">
          <div className="row"><span>{countLabel}</span><b>{totalLabel}</b></div>
          <a href={`/${V.key}/build/`} className="cfg-buildbtn">Build ansehen</a>
        </div>
      </aside>

      <section className="cfg-stage">
        {view === 'v3d' ? (
          <>
            <LazyStage config={config} zone={zone} hotspots theme="dark" model3d={V.gen.model3d} onZone={z => pickCat(z, true)} />
            <div className="cfg-title"><span>{actIdx} / 07</span><h2>{actCat.name}</h2></div>
            <div className="cfg-hint"><span className="desk">Ziehen zum Drehen · Scrollen zum Zoomen · Punkte anklicken</span><span className="mob">Ziehen zum Drehen · Punkte antippen</span></div>
          </>
        ) : (
          <div className="cfg-list">
            <div className="head">
              <h2>{actCat.name}<br /><span>{title}</span></h2>
              <label>Sortieren
                <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}>
                  <option value="pick">Empfehlung</option><option value="asc">Preis aufsteigend</option><option value="desc">Preis absteigend</option>
                </select>
              </label>
            </div>
            <div className="grid">
              {listParts.map(p => (
                <button key={p.id} type="button" className={`card${detail === p.id ? ' sel' : ''}`} onClick={() => choose(p)}>
                  <div className="img">Produktbild{p.pick && <span className="gpick">G Pick</span>}</div>
                  <div className="body">
                    <span className="br">{p.brand}</span>
                    <span className="nm">{p.name}</span>
                    <span className="pr"><b>{priceLabel(p)}</b><span>{p.shop || 'Serienausstattung'}</span></span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="cfg-tools">
          {view === 'v3d' && zone !== 'overview' && <button type="button" className="ovw" onClick={() => setZone('overview')}>Gesamtansicht</button>}
          <div className="seg">
            <button type="button" className={view === 'v3d' ? 'on' : ''} onClick={() => setView('v3d')}>3D</button>
            <button type="button" className={view === 'vlist' ? 'on' : ''} onClick={() => setView('vlist')}>Liste</button>
          </div>
        </div>
      </section>

      <aside className="cfg-panel">
        {!showDetail ? (
          <>
            <div className="pl-head">
              <span>{actIdx} — {actCat.name}</span>
              <p>{catParts.length - 1} handverlesene Teile für deinen {title}</p>
            </div>
            <div>
              {catParts.map(p => {
                const inBuild = chosenId(p.cat) === p.id;
                return (
                  <button key={p.id} type="button" className={`pl-item${inBuild ? ' in' : ''}`} onClick={() => choose(p)}>
                    <div className="th">{p.stock ? 'SERIE' : 'BILD'}</div>
                    <div className="tx">
                      <div className="top"><span className="br">{p.brand}</span>{inBuild && <span className="am">AM AUTO</span>}</div>
                      <span className="nm">{p.name}</span>
                      <span className="pr"><b>{priceLabel(p)}</b><span>{p.shop || 'Serienausstattung'}</span></span>
                      {p.pick && <span className="gpick sm">G Pick</span>}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="pl-foot" suppressHydrationWarning>Klicke ein Teil, um es am Auto zu sehen. Preise inkl. MwSt., Stand {new Date().toLocaleDateString('de-DE')}.</p>
          </>
        ) : dp && (
          <Detail
            p={dp} title={title} ps={engine.ps} catName={actCat.name}
            pos={detail ? `${catParts.indexOf(dp) + 1} / ${catParts.length}` : ''}
            canReset={!!detail && !dp.stock && chosenId(dp.cat) === dp.id}
            onClose={() => { setDetail(null); setView('v3d'); }}
            onReset={() => { store.setPart(V.key, dp.cat, null); setDetail(stockOf(dp.cat)?.id || null); }}
          />
        )}
      </aside>

      <div className="cfg-bar mob">
        <div><span>{countLabel}</span><b>{totalLabel}</b></div>
        <a href={`/${V.key}/build/`}>Build ansehen</a>
      </div>
    </main>
  );
}

function Detail({ p, title, ps, catName, pos, canReset, onClose, onReset }: { p: Part; title: string; ps: string; catName: string; pos: string; canReset: boolean; onClose: () => void; onReset: () => void }) {
  const specs = [{ k: 'Passend für', v: `${title} · ${ps}` }, { k: 'Hersteller', v: p.stock ? 'Serie' : p.brand }, { k: 'Kategorie', v: catName }].concat(p.shop ? [{ k: 'Shop', v: p.shop }] : []);
  return (
    <div className="dt">
      <div className="dt-top"><button type="button" onClick={onClose}>← Alle {catName}</button><span>{pos}</span></div>
      <div className="dt-img">Produktbild{p.pick && <span className="gpick">G Performance Pick</span>}</div>
      <div className="dt-head">
        <span className="br">{p.brand}</span>
        <h3>{p.name}</h3>
        <p>{p.note}</p>
      </div>
      {p.stock && <div className="dt-oem">Serienausstattung deines Fahrzeugs. Wähle ein anderes Teil, um es am Auto zu vergleichen.</div>}
      {!p.stock && (
        <>
          <div className="dt-offer">
            <div className="row">
              <div><span>Empfohlener Shop</span><b>{p.shop}</b></div>
              <strong>{priceLabel(p)}</strong>
            </div>
            {p.hasLink
              ? <a href={goHref(p)} target="_blank" rel="sponsored nofollow noopener" className="cta">Zum Angebot bei {p.shop}*</a>
              : <span className="cta off">Link folgt</span>}
          </div>
          <p className="dt-fine">*Affiliate-Link. Kaufst du darüber, erhalten wir eine Provision. Für dich ändert sich der Preis nicht.</p>
        </>
      )}
      {p.pick && (
        <div className="dt-note">
          <div className="who">
            <div className="av"><img src="/assets/gp-logo.jpg" alt="" /></div>
            <div><b>Notiz von G Performance</b><span>Warum dieses Teil</span></div>
          </div>
          <p>„{p.quote}“</p>
        </div>
      )}
      <dl className="dt-specs">
        {specs.map(s => [<dt key={s.k + 't'}>{s.k}</dt>, <dd key={s.k + 'd'}>{s.v}</dd>])}
      </dl>
      {canReset && <button type="button" className="dt-reset" onClick={onReset}>Wieder auf Serie setzen</button>}
      <div style={{ height: 32 }} />
    </div>
  );
}
