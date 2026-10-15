import { useEffect, useState } from 'react';
import type { Make } from '../../lib/types';
import { store } from '../../lib/store';

type Sel = { make: string; model: string; gen: string; engine: string };
const KEYS = ['make', 'model', 'gen', 'engine'] as const;

export default function VehicleSelect({ makes, live }: { makes: Make[]; live: string[] }) {
  const [sel, setSel] = useState<Sel>({ make: '', model: '', gen: '', engine: '' });
  const [step, setStep] = useState(0);
  useEffect(() => {
    const v = store.get().vehicle; if (!v) return;
    const [make, model, gen] = v.key.split('/'); setSel({ make, model, gen, engine: v.engine }); setStep(3);
  }, []);

  const make = makes.find(m => m.slug === sel.make), model = make?.models.find(m => m.slug === sel.model);
  const gen = model?.generations.find(g => g.slug === sel.gen), engine = gen?.engines.find(e => e.slug === sel.engine);
  const defs = [
    { label: 'Marke', value: make?.name, list: makes.map(m => ({ id: m.slug, name: m.name, meta: m.soon ? 'Bald verfügbar' : `${m.models.length} Modelle`, soon: m.soon })) },
    { label: 'Modell', value: model?.name, list: (make?.models || []).map(m => ({ id: m.slug, name: m.name, meta: m.soon ? 'Bald verfügbar' : m.meta, soon: m.soon })) },
    { label: 'Generation', value: gen?.name, list: (model?.generations || []).map(g => {
      const soon = g.soon || !live.includes(`${make!.slug}/${model!.slug}/${g.slug}`);
      return { id: g.slug, name: g.name, meta: soon ? 'Bald verfügbar' : g.meta, soon };
    }) },
    { label: 'Motor', value: engine?.name, list: (gen?.engines || []).map(e => ({ id: e.slug, name: e.ps, meta: e.name, soon: false })) }
  ];
  const cur = defs[step];

  const pick = (id: string) => {
    const patch: Partial<Sel> = { [KEYS[step]]: id };
    KEYS.slice(step + 1).forEach(k => (patch[k] = ''));
    const next = { ...sel, ...patch };
    setSel(next);
    if (step < 3) return setStep(step + 1);
    const e = gen!.engines.find(x => x.slug === id)!, key = `${next.make}/${next.model}/${next.gen}`;
    store.setVehicle({ key, engine: id, label: `${make!.name} ${model!.name} ${gen!.name} · ${e.ps}` });
    location.href = `/${key}/`;
  };

  return (
    <div className="wrap sel-in">
      <div className="steps">
        {defs.map((d, i) => (
          <button key={d.label} type="button" className={i === step ? 'on' : d.value ? 'done' : ''} onClick={() => { if (i === 0 || defs[i - 1].value) setStep(i); }}>
            <small>0{i + 1}</small><span>{d.value || d.label}</span>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <h1 key={step} className="d-page">{cur.label} wählen</h1>
        {step > 0 && <button type="button" className="link-u" style={{ borderBottom: '1px solid var(--mute)', color: 'var(--soft)' }} onClick={() => setStep(step - 1)}>← Zurück</button>}
      </div>
      <div className="tiles">
        {cur.list.map(t => (
          <button key={t.id} type="button" className="tile" disabled={t.soon} onClick={() => pick(t.id)}>
            <b>{t.name}</b><span>{t.meta}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
