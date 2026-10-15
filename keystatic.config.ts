import { config, collection, singleton, fields } from '@keystatic/core';

// Admin-Oberfläche unter /keystatic. Lokal werden Dateien direkt geschrieben,
// in Produktion speichert Keystatic jede Änderung als Commit im GitHub-Repo.
const CATEGORIES = [
  { label: 'Felgen', value: 'felgen' },
  { label: 'Bremsen', value: 'bremsen' },
  { label: 'Fahrwerk', value: 'fahrwerk' },
  { label: 'Abgasanlage', value: 'abgas' },
  { label: 'Frontlippe', value: 'front' },
  { label: 'Heckspoiler', value: 'heck' },
  { label: 'Ansaugung', value: 'motor' }
];
const none = { label: '— keine —', value: 'none' };

export default config({
  storage: import.meta.env.PROD
    ? { kind: 'github', repo: { owner: 'R4zee', name: 'gperformance-teile' } }
    : { kind: 'local' },
  ui: {
    brand: { name: 'G Performance' },
    navigation: { Inhalte: ['teile', 'marken'], Seiten: ['startseite'] }
  },
  collections: {
    teile: collection({
      label: 'Teile',
      path: 'src/content/teile/*',
      format: { data: 'json' },
      slugField: 'title',
      columns: ['title', 'price'],
      schema: {
        title: fields.slug({ name: { label: 'Interner Titel', description: 'z. B. „BMW M4 F82 – BBS FI-R 20 Zoll“. Daraus wird die URL.' } }),
        vehicle: fields.text({ label: 'Fahrzeug', description: 'Marke/Modell/Generation, z. B. bmw/m4/f82', validation: { isRequired: true } }),
        category: fields.select({ label: 'Kategorie', options: CATEGORIES, defaultValue: 'felgen' }),
        order: fields.integer({ label: 'Reihenfolge', defaultValue: 10 }),
        stock: fields.checkbox({ label: 'Serienteil', description: 'Genau ein Serienteil pro Kategorie und Fahrzeug. Ohne Preis und Link.' }),
        brand: fields.text({ label: 'Hersteller', validation: { isRequired: true } }),
        name: fields.text({ label: 'Produktname', validation: { isRequired: true } }),
        price: fields.number({ label: 'Preis in € (inkl. MwSt.)', validation: { isRequired: false } }),
        shop: fields.text({ label: 'Empfohlener Shop' }),
        url: fields.url({ label: 'Produkt-Link', description: 'Normaler Shop-Link. Amazon- und eBay-Partner-IDs werden automatisch angehängt.', validation: { isRequired: false } }),
        note: fields.text({ label: 'Kurzbeschreibung', multiline: true }),
        quote: fields.text({ label: 'Notiz von G Performance', description: 'Ausgefüllt = „G Pick“.', multiline: true }),
        visual: fields.object({
          rimStyle: fields.select({ label: 'Felge: Design', options: [none, { label: 'Doppelspeiche', value: 'double' }, { label: 'Mesh / 10 Speichen', value: 'mesh' }, { label: 'Y-Speiche', value: 'y' }, { label: '12 dünne Speichen', value: 'thin12' }], defaultValue: 'none' }),
          rimColor: fields.text({ label: 'Felge: Farbe (Hex)' }),
          rimMetal: fields.number({ label: 'Felge: Metallic 0–1', validation: { isRequired: false } }),
          rimRough: fields.number({ label: 'Felge: Rauheit 0–1', validation: { isRequired: false } }),
          rimSize: fields.number({ label: 'Felge: Radius (0.245 = 19", 0.26 = 20")', validation: { isRequired: false } }),
          caliper: fields.text({ label: 'Bremssattel: Farbe (Hex)' }),
          drop: fields.number({ label: 'Tieferlegung in m (0.02 = 20 mm)', validation: { isRequired: false } }),
          tips: fields.select({ label: 'Endrohre', options: [none, { label: 'Chrom', value: 'chrome' }, { label: 'Carbon', value: 'carbon' }, { label: 'Titan (blau)', value: 'titan' }], defaultValue: 'none' }),
          lip: fields.select({ label: 'Frontlippe', options: [none, { label: 'Carbon', value: 'carbon' }, { label: 'Schwarz glänzend', value: 'gloss' }], defaultValue: 'none' }),
          spoiler: fields.select({ label: 'Heck', options: [none, { label: 'Abrisskante', value: 'lip' }, { label: 'Flügel', value: 'wing' }], defaultValue: 'none' }),
          intake: fields.select({ label: 'Ansaugung', options: [none, { label: 'Carbon', value: 'carbon' }, { label: 'Schwarz glänzend', value: 'gloss' }], defaultValue: 'none' })
        }, { label: '3D-Darstellung' })
      }
    }),
    marken: collection({
      label: 'Marken & Fahrzeuge',
      path: 'src/content/marken/*',
      format: { data: 'json' },
      slugField: 'name',
      schema: {
        name: fields.slug({ name: { label: 'Marke' } }),
        order: fields.integer({ label: 'Reihenfolge', defaultValue: 10 }),
        soon: fields.checkbox({ label: 'Bald verfügbar' }),
        models: fields.array(fields.object({
          slug: fields.text({ label: 'URL-Kürzel', description: 'z. B. m4' }),
          name: fields.text({ label: 'Modell' }),
          meta: fields.text({ label: 'Zusatz', description: 'z. B. F82 · G82' }),
          soon: fields.checkbox({ label: 'Bald verfügbar' }),
          generations: fields.array(fields.object({
            slug: fields.text({ label: 'URL-Kürzel', description: 'z. B. f82' }),
            name: fields.text({ label: 'Generation' }),
            meta: fields.text({ label: 'Zusatz', description: 'z. B. Coupé · 2014 – 2020' }),
            soon: fields.checkbox({ label: 'Bald verfügbar' }),
            model3d: fields.text({ label: '3D-Modell (GLB-URL)', description: 'Leer = stilisiertes Auto. Aufbau siehe docs/3D-MODELLE.md' }),
            engines: fields.array(fields.object({
              slug: fields.text({ label: 'URL-Kürzel' }),
              name: fields.text({ label: 'Motor' }),
              ps: fields.text({ label: 'Leistung', description: 'z. B. 431 PS' })
            }), { label: 'Motoren', itemLabel: p => p.fields.name.value })
          }), { label: 'Generationen', itemLabel: p => p.fields.name.value })
        }), { label: 'Modelle', itemLabel: p => p.fields.name.value })
      }
    })
  },
  singletons: {
    startseite: singleton({
      label: 'Startseite',
      path: 'src/content/seiten/startseite',
      format: { data: 'json' },
      schema: {
        heroVehicle: fields.text({ label: 'Build des Monats: Fahrzeug', description: 'z. B. bmw/m4/f82' }),
        heroTitle: fields.text({ label: 'Build des Monats: Titel' }),
        heroBuild: fields.array(fields.text({ label: 'Teil-ID' }), { label: 'Build des Monats: Teile', description: 'Dateinamen der Teile ohne .json', itemLabel: p => p.value }),
        popular: fields.array(fields.object({
          name: fields.text({ label: 'Name' }),
          meta: fields.text({ label: 'Zusatz' }),
          vehicle: fields.text({ label: 'Fahrzeug', description: 'Leer = „Bald verfügbar“' })
        }), { label: 'Beliebte Builds', itemLabel: p => p.fields.name.value })
      }
    })
  }
});
