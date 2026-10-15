import { defineCollection } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

// Die Dateien werden über Keystatic (/keystatic) gepflegt. Schema = keystatic.config.ts.
const sel = <T extends string>(...v: T[]) => z.enum(['none', ...v] as ['none', ...T[]]).catch('none');
const num = z.number().nullable().optional().transform(v => v ?? null);

const teile = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/teile' }),
  schema: z.object({
    title: z.string(),
    vehicle: z.string(),
    category: z.enum(['felgen', 'bremsen', 'fahrwerk', 'abgas', 'front', 'heck', 'motor']),
    order: z.number().default(10),
    stock: z.boolean().default(false),
    brand: z.string(),
    name: z.string(),
    price: num,
    shop: z.string().default(''),
    url: z.string().nullable().default(''),
    note: z.string().default(''),
    quote: z.string().default(''),
    visual: z.object({
      rimStyle: sel('double', 'mesh', 'y', 'thin12'),
      rimColor: z.string().default(''),
      rimMetal: num, rimRough: num, rimSize: num,
      caliper: z.string().default(''),
      drop: num,
      tips: sel('chrome', 'carbon', 'titan'),
      lip: sel('carbon', 'gloss'),
      spoiler: sel('lip', 'wing'),
      intake: sel('carbon', 'gloss')
    })
  })
});

const engine = z.object({ slug: z.string(), name: z.string(), ps: z.string() });
const generation = z.object({ slug: z.string(), name: z.string(), meta: z.string().default(''), soon: z.boolean().default(false), model3d: z.string().default(''), engines: z.array(engine).default([]) });
const model = z.object({ slug: z.string(), name: z.string(), meta: z.string().default(''), soon: z.boolean().default(false), generations: z.array(generation).default([]) });

const marken = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/marken' }),
  schema: z.object({ name: z.string(), order: z.number().default(10), soon: z.boolean().default(false), models: z.array(model).default([]) })
});

const seiten = defineCollection({
  loader: file('./src/content/seiten/startseite.json', { parser: text => ({ startseite: JSON.parse(text) }) }),
  schema: z.object({
    heroVehicle: z.string(),
    heroTitle: z.string(),
    heroBuild: z.array(z.string()).default([]),
    popular: z.array(z.object({ name: z.string(), meta: z.string(), vehicle: z.string().default('') })).default([])
  })
});

export const collections = { teile, marken, seiten };
