// Nur auf dem Server (Build) verwenden.
import { getCollection, getEntry } from 'astro:content';
import { affiliateUrl } from './affiliate';
import type { CatId, Make, Part, Visual, VehicleCatalog } from './types';
import { CATS } from './types';

type Entry = Awaited<ReturnType<typeof getCollection<'teile'>>>[number];

function toVisual(v: Entry['data']['visual']): Visual {
  const o: Visual = {};
  if (v.rimStyle !== 'none') o.rim = { style: v.rimStyle, color: v.rimColor || undefined, metal: v.rimMetal ?? undefined, rough: v.rimRough ?? undefined, r: v.rimSize ?? undefined };
  if (v.caliper) o.caliper = v.caliper;
  if (v.drop != null) o.drop = v.drop;
  if (v.tips !== 'none') o.tips = v.tips;
  if (v.lip !== 'none') o.lip = v.lip;
  if (v.spoiler !== 'none') o.spoiler = v.spoiler;
  if (v.intake !== 'none') o.intake = v.intake;
  return o;
}

function toPart(e: Entry): Part {
  const d = e.data, prefix = `${d.vehicle.replaceAll('/', '-')}-${d.category}-`;
  return {
    id: e.id, slug: e.id.startsWith(prefix) ? e.id.slice(prefix.length) : e.id,
    cat: d.category as CatId, order: d.order, stock: d.stock,
    brand: d.brand, name: d.name, price: d.stock ? null : d.price, shop: d.stock ? '' : d.shop,
    hasLink: !d.stock && !!affiliateUrl(d.url), note: d.note, quote: d.quote, pick: !!d.quote.trim(), vis: toVisual(d.visual)
  };
}

export async function getMakes(): Promise<Make[]> {
  const all = await getCollection('marken');
  return all.sort((a, b) => a.data.order - b.data.order).map(e => ({ slug: e.id, name: e.data.name, soon: e.data.soon, models: e.data.models }));
}

export async function getAllParts() {
  return (await getCollection('teile')).map(e => ({ part: toPart(e), vehicle: e.data.vehicle, url: affiliateUrl(e.data.url) }));
}

/** Alle verfügbaren Fahrzeuge (nicht „bald“) mit Teilen. */
export async function getVehicles(): Promise<VehicleCatalog[]> {
  const [makes, parts] = await Promise.all([getMakes(), getCollection('teile')]);
  const out: VehicleCatalog[] = [];
  for (const mk of makes) {
    if (mk.soon) continue;
    for (const md of mk.models) {
      if (md.soon) continue;
      for (const g of md.generations) {
        if (g.soon || !g.engines.length) continue;
        const key = `${mk.slug}/${md.slug}/${g.slug}`;
        const list = parts.filter(p => p.data.vehicle === key).map(toPart)
          .sort((a, b) => CATS.findIndex(c => c.id === a.cat) - CATS.findIndex(c => c.id === b.cat) || Number(b.stock) - Number(a.stock) || a.order - b.order);
        if (!list.length) continue;
        out.push({ key, make: { slug: mk.slug, name: mk.name }, model: { slug: md.slug, name: md.name }, gen: g, parts: list });
      }
    }
  }
  return out;
}

export async function getHome() {
  const e = await getEntry('seiten', 'startseite');
  if (!e) throw new Error('src/content/seiten/startseite.json fehlt');
  return e.data;
}
