// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';
import keystatic from '@keystatic/astro';
import affiliateRedirects from './integrations/affiliate-redirects.mjs';

// Lokal (astro dev) läuft alles in Node, damit Keystatic Dateien direkt im Projekt speichern kann.
// Für den Build kommt der Cloudflare-Adapter dazu.
const isDev = process.argv.includes('dev');

export default defineConfig({
  site: 'https://gperformance-teile.pages.dev',
  trailingSlash: 'ignore',
  // Alle Seiten werden statisch gebaut. Nur das Keystatic-Admin (/keystatic) läuft on demand.
  output: 'static',
  adapter: isDev ? undefined : cloudflare(),
  integrations: [react(), keystatic(), affiliateRedirects()],
  devToolbar: { enabled: false },
  vite: {
    ssr: { noExternal: ['three'] }
  }
});
