// Fetch each candidate's website and extract instagram / email / whatsapp / facebook / linkedin.
// Usage: node enrich.mjs <candidates.json> <siteinfo.json>
import fs from 'fs';

const cands = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const OUT = process.argv[3];
const out = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

const IG_SKIP = /^(p|reel|reels|explore|stories|accounts|share|tv|sharer)$/i;
function extract(html) {
  const ig = [...html.matchAll(/instagram\.com\/([A-Za-z0-9_.]{2,30})/g)].map(m => m[1].replace(/\.$/, '')).filter(h => !IG_SKIP.test(h));
  const emails = [...html.matchAll(/(?:mailto:)?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(?:com|org|br|net|edu)(?:\.br)?)/g)].map(m => m[1].toLowerCase())
    .filter(e => !/\.(png|jpg|jpeg|gif|webp|svg)$/.test(e) && !/sentry|example|wixpress|domain\.com|email\.com|seuemail/.test(e));
  const wa = [...html.matchAll(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=|whatsapp\.com\/send\/?\?phone=)(\d{10,13})/g)].map(m => m[1]);
  const fb = [...html.matchAll(/facebook\.com\/([A-Za-z0-9_.-]{3,60})/g)].map(m => m[1]).filter(h => !/sharer|share|plugins|tr$|dialog/.test(h));
  const li = [...html.matchAll(/linkedin\.com\/(company|school|in)\/([A-Za-z0-9_-]{2,80})/g)].map(m => `${m[1]}/${m[2]}`);
  const uniq = a => [...new Set(a)].slice(0, 3);
  return { instagram: uniq(ig), emails: uniq(emails), whatsapp: uniq(wa), facebook: uniq(fb), linkedin: uniq(li) };
}

const urls = [...new Set(cands.map(c => c.website).filter(Boolean))].filter(u => !(u in out));
console.log(urls.length, 'sites to fetch');
let i = 0;
async function worker() {
  while (i < urls.length) {
    const u = urls[i++];
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 12000);
      const r = await fetch(u, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126 Safari/537.36' } });
      clearTimeout(t);
      const html = await r.text();
      out[u] = { status: r.status, finalUrl: r.url, ...extract(html) };
    } catch (e) {
      out[u] = { status: 0, error: String(e.message || e).slice(0, 100) };
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log('done', Object.keys(out).length);
