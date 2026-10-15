import { useEffect, useState } from 'react';
import type { Make } from '../../lib/types';
import { store } from '../../lib/store';

export default function QuickPicker({ makes }: { makes: Make[] }) {
  const [sel, setSel] = useState({ make: '', model: '', gen: '', engine: '' });
  useEffect(() => {
    const v = store.get().vehicle; if (!v) return;
    const [make, model, gen] = v.key.split('/'); setSel({ make, model, gen, engine: v.engine });
  }, []);
  const make = makes.find(m => m.slug === sel.make), model = make?.models.find(m => m.slug === sel.model);
  const gen = model?.generations.find(g => g.slug === sel.gen), engine = gen?.engines.find(e => e.slug === sel.engine);
  const opt = (arr: { slug: string; name: string; soon: boolean }[] = []) => arr.map(x => <option key={x.slug} value={x.slug} disabled={x.soon}>{x.soon ? `${x.name} (bald)` : x.name}</option>);
  const go = () => {
    if (!make || !model || !gen || !engine) return;
    const key = `${make.slug}/${model.slug}/${gen.slug}`;
    store.setVehicle({ key, engine: engine.slug, label: `${make.name} ${model.name} ${gen.name} · ${engine.ps}` });
    location.href = `/${key}/`;
  };
  return (
    <div className="qp">
      <label><span>01 Marke</span>
        <select value={sel.make} onChange={e => setSel({ make: e.target.value, model: '', gen: '', engine: '' })}><option value="">Wählen</option>{opt(makes)}</select>
      </label>
      <label><span>02 Modell</span>
        <select value={sel.model} disabled={!make} onChange={e => setSel(s => ({ ...s, model: e.target.value, gen: '', engine: '' }))}><option value="">Wählen</option>{opt(make?.models)}</select>
      </label>
      <label><span>03 Generation</span>
        <select value={sel.gen} disabled={!model} onChange={e => setSel(s => ({ ...s, gen: e.target.value, engine: '' }))}><option value="">Wählen</option>{opt(model?.generations)}</select>
      </label>
      <label><span>04 Motor</span>
        <select value={sel.engine} disabled={!gen} onChange={e => setSel(s => ({ ...s, engine: e.target.value }))}>
          <option value="">Wählen</option>
          {gen?.engines.map(e => <option key={e.slug} value={e.slug}>{`${e.ps} · ${e.name}`}</option>)}
        </select>
      </label>
      <button type="button" className="qp-go" disabled={!engine} onClick={go}>Teile anzeigen →</button>
    </div>
  );
}
