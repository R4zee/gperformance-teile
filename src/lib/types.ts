// Gemeinsame Typen und Konstanten für Server (Astro) und Browser (React-Inseln).
export const CATS = [
  { id: 'felgen', name: 'Felgen' }, { id: 'bremsen', name: 'Bremsen' }, { id: 'fahrwerk', name: 'Fahrwerk' },
  { id: 'abgas', name: 'Abgasanlage' }, { id: 'front', name: 'Frontlippe' }, { id: 'heck', name: 'Heckspoiler' }, { id: 'motor', name: 'Ansaugung' }
] as const;
export type CatId = (typeof CATS)[number]['id'];
export type Zone = CatId | 'overview';

export type Visual = {
  rim?: { style: 'double' | 'mesh' | 'y' | 'thin12'; color?: string; metal?: number; rough?: number; r?: number };
  caliper?: string;
  drop?: number;
  tips?: 'chrome' | 'carbon' | 'titan';
  lip?: 'carbon' | 'gloss';
  spoiler?: 'lip' | 'wing';
  intake?: 'carbon' | 'gloss';
};
export type CarConfig = Visual & { paint: string; stock: Partial<Record<CatId, boolean>> };

export type Part = {
  id: string; slug: string; cat: CatId; order: number; stock: boolean;
  brand: string; name: string; price: number | null; shop: string;
  hasLink: boolean; note: string; quote: string; pick: boolean; vis: Visual;
};

export type Engine = { slug: string; name: string; ps: string };
export type Generation = { slug: string; name: string; meta: string; soon: boolean; model3d: string; engines: Engine[] };
export type Model = { slug: string; name: string; meta: string; soon: boolean; generations: Generation[] };
export type Make = { slug: string; name: string; soon: boolean; models: Model[] };

/** Ein Fahrzeug mit allen Teilen – wird an Konfigurator und Build-Seite übergeben. */
export type VehicleCatalog = {
  key: string; // bmw/m4/f82
  make: { slug: string; name: string };
  model: { slug: string; name: string };
  gen: Generation;
  parts: Part[];
};

export type Build = Partial<Record<CatId, string>>;
export type ActiveVehicle = { key: string; engine: string; label: string };

export const PAINTS = { yasmarina: '#1f5fa8', austin: '#d9a300', sapphire: '#121417', alpine: '#e9eaea', mineral: '#5b6066' } as const;
export const DEFAULT_PAINT = PAINTS.yasmarina;

export const eur = (n: number | null) => n == null ? 'Serie' : new Intl.NumberFormat('de-DE', {
  style: 'currency', currency: 'EUR', maximumFractionDigits: n % 1 ? 2 : 0, minimumFractionDigits: n % 1 ? 2 : 0
}).format(n);

/** Serie / Preis / „Preis im Shop“ (z. B. Amazon ohne API-Preis). */
export const priceLabel = (p: Part) => p.stock ? 'Serie' : p.price == null ? 'Preis im Shop' : eur(p.price);

export const goHref = (p: Part) => `/go/${p.id}/`;
export const vehiclePath = (key: string) => `/${key}/`;
export const partPath = (key: string, p: Part) => `/${key}/${p.cat}/${p.slug}/`;

/** Bild für das 3D-Auto aus der aktuellen Auswahl (fehlende Kategorie = Serie). */
export function carConfig(cat: VehicleCatalog, build: Build, paint: string = DEFAULT_PAINT): CarConfig {
  const v: CarConfig = { paint, stock: {} };
  for (const c of CATS) {
    const list = cat.parts.filter(p => p.cat === c.id);
    const p = list.find(x => x.id === build[c.id]) || list.find(x => x.stock) || list[0];
    if (!p) continue;
    Object.assign(v, p.vis);
    v.stock[c.id] = p.stock;
  }
  return v;
}
