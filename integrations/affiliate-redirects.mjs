// Schreibt nach dem Build _redirects (Cloudflare): /go/<teil>/ → Shop-Link mit Partner-ID (302).
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import { DEFAULT_IDS, withPartnerIds } from '../src/lib/affiliate-core.mjs';

export default function affiliateRedirects() {
  return {
    name: 'affiliate-redirects',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const env = { ...loadEnv('production', process.cwd(), 'PUBLIC_'), ...process.env };
        const ids = { amazon: env.PUBLIC_AMAZON_TAG || DEFAULT_IDS.amazon, ebay: env.PUBLIC_EBAY_CAMPID || DEFAULT_IDS.ebay };
        const src = new URL('../src/content/teile/', import.meta.url);
        const lines = [];
        for (const f of readdirSync(src).filter(f => f.endsWith('.json'))) {
          const d = JSON.parse(readFileSync(new URL(f, src), 'utf8'));
          const url = d.stock ? '' : withPartnerIds(d.url, ids);
          if (url) { const id = f.replace(/\.json$/, ''); lines.push(`/go/${id} ${url} 302`, `/go/${id}/ ${url} 302`); }
        }
        const out = fileURLToPath(new URL('_redirects', dir));
        const prev = existsSync(out) ? readFileSync(out, 'utf8').trimEnd() + '\n' : '';
        writeFileSync(out, prev + lines.join('\n') + '\n');
        logger.info(`${lines.length / 2} Affiliate-Weiterleitungen → ${out}`);
      }
    }
  };
}
