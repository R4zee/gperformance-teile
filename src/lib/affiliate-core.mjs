// Reine Funktion ohne Astro-Abhängigkeit – genutzt von der Website und vom Redirect-Build-Schritt.
/** @param {string|null|undefined} raw @param {{amazon:string, ebay:string}} ids */
export function withPartnerIds(raw, ids) {
  if (!raw) return '';
  let u;
  try { u = new URL(raw); } catch { return ''; }
  const host = u.hostname.replace(/^www\./, '');
  if (/^amazon\.(de|com|co\.uk|fr|it|es|nl|at)$/.test(host) && !u.searchParams.has('tag')) u.searchParams.set('tag', ids.amazon);
  if (/^ebay\.(de|com|at|co\.uk)$/.test(host) && !u.searchParams.has('campid')) {
    u.searchParams.set('mkcid', '1'); u.searchParams.set('mkrid', '707-53477-19255-0');
    u.searchParams.set('campid', ids.ebay); u.searchParams.set('toolid', '10001');
  }
  return u.toString();
}
export const DEFAULT_IDS = { amazon: 'gperformance-21', ebay: '0000000000' };
