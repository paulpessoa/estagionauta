// Second-pass enrichment: brand propagation + contact-page scraping (email/whatsapp/socials).
// Bing search was dropped: its matches proved imprecise and were discarded in the validated southern run.
// Usage: node enrich2.mjs <dir>   (reads plan.json, siteinfo.json; writes enrich2.json cache + plan_enriched.json)
import fs from 'fs';
const D = process.argv[2];
const plan = JSON.parse(fs.readFileSync(`${D}/plan.json`, 'utf8'));
const site = fs.existsSync(`${D}/siteinfo.json`) ? JSON.parse(fs.readFileSync(`${D}/siteinfo.json`, 'utf8')) : {};
const CACHE = `${D}/enrich2.json`;
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : { pages: {} };
const save = () => fs.writeFileSync(CACHE, JSON.stringify(cache));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const IG_SKIP = /^(p|reel|reels|explore|stories|accounts|share|tv|popular|directory)$/i;

async function pageContacts(url) {
  if (url in cache.pages) return cache.pages[url] || {};
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 10000);
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': UA } });
    clearTimeout(t);
    cache.pages[url] = r.ok ? contacts((await r.text()).slice(0, 400000)) : null;
  } catch { cache.pages[url] = null; }
  return cache.pages[url] || {};
}
function contacts(html) {
  if (!html) return {};
  const emails = [...html.matchAll(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(?:com|org|br|net|edu)(?:\.br)?)/g)].map(m => m[1].toLowerCase())
    .filter(e => !/\.(png|jpe?g|gif|webp|svg)$/.test(e) && !/sentry|example|wixpress|domain\.com|email\.com|seuemail|exemplo|godaddy|nome@/.test(e));
  const wa = [...html.matchAll(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=|whatsapp\.com\/send\/?\?phone=)(\d{10,13})/g)].map(m => m[1]);
  const ig = [...html.matchAll(/instagram\.com\/([A-Za-z0-9_.]{2,30})/g)].map(m => m[1].replace(/\.$/, '')).filter(h => !IG_SKIP.test(h));
  const fb = [...html.matchAll(/facebook\.com\/([A-Za-z0-9_.-]{3,60})/g)].map(m => m[1]).filter(h => !/sharer|share|plugins|tr$|dialog|profile\.php/.test(h));
  const li = [...html.matchAll(/linkedin\.com\/(company|school)\/([A-Za-z0-9_-]{2,80})/g)].map(m => `${m[1]}/${m[2]}`);
  const u = a => [...new Set(a)];
  return { emails: u(emails), whatsapp: u(wa), instagram: u(ig), facebook: u(fb), linkedin: u(li) };
}

const kept = plan.filter(d => d.cand && d.fields.status !== 'rejected');

// 1. Brand propagation: dominant site/instagram within brand+state
const brandVals = {};
for (const d of kept) {
  if (!d.cand.brand) continue;
  const k = `${d.cand.brand}|${d.cand.state}`;
  brandVals[k] ??= { ig: {}, site: {} };
  if (d.fields.instagram) brandVals[k].ig[d.fields.instagram] = (brandVals[k].ig[d.fields.instagram] || 0) + 1;
  if (d.fields.website) { const h = d.fields.website.replace(/^http:/, 'https:'); brandVals[k].site[h] = (brandVals[k].site[h] || 0) + 1; }
}
const top = o => Object.entries(o).sort((a, b) => b[1] - a[1])[0]?.[0];
for (const d of kept) {
  d.extra = { facebook: [], linkedin: [], whatsapp: [], sources: [] };
  if (!d.cand.brand) continue;
  const v = brandVals[`${d.cand.brand}|${d.cand.state}`];
  if (!d.fields.instagram && top(v.ig)) { d.fields.instagram = top(v.ig); d.extra.sources.push('instagram: perfil oficial da rede no estado'); }
  if (!d.fields.website && top(v.site)) { d.fields.website = top(v.site); d.extra.sources.push('site: site oficial da rede no estado'); }
}

// 2. Contact pages
let saved = 0;
for (const d of kept) {
  const f = d.fields;
  if (!f.website) continue;
  let base; try { base = new URL(f.website).origin; } catch { continue; }
  const s0 = site[d.cand.website] || {};
  const agg = { emails: [...(s0.emails || [])], whatsapp: [...(s0.whatsapp || [])], instagram: [...(s0.instagram || [])], facebook: [...(s0.facebook || [])], linkedin: [...(s0.linkedin || [])] };
  for (const path of ['/', '/contato', '/contato/', '/fale-conosco', '/contact']) {
    const c = await pageContacts(base + path);
    for (const k of Object.keys(agg)) agg[k].push(...(c[k] || []));
  }
  if (++saved % 20 === 0) { save(); console.log('contact pages for', saved, 'sites'); }
  const host = new URL(base).hostname.replace(/^www\./, '');
  const domain = host.split('.').slice(-3).join('.');
  const cityTok = norm(f.city).replace(/[^a-z]/g, '');
  const score = e => {
    const user = e.split('@')[0];
    let s = e.endsWith(domain) ? 2 : 0;
    if (/^(contato|atendimento|faleconosco|fale|sac|relacionamento|estagio|estagios|comercial|secretaria|info|ola|oi)/.test(user)) s += 3;
    if (cityTok && user.replace(/[^a-z]/g, '').includes(cityTok.slice(0, 6))) s += 2;
    if (/lgpd|dpo|privacidade|ouvidoria|aprendiz|caixa|regulariza|financeiro|cobranca|nfe|nota|juridico|imprensa|marketing|compras|licitac|noreply|no-reply|webmaster|suporte|ti@|curriculo|vagas|trabalheconosco|rh@/.test(e)) s -= 4;
    return s;
  };
  const NEG = /lgpd|dpo|privacidade|protecao|ouvidoria|aprendiz|caixa|regulariza|financeiro|cobranca|nfe|nota|juridico|imprensa|noticia|marketing|compras|licitac|noreply|no-reply|webmaster|suporte|curriculo|vagas|trabalheconosco|ppg|pos\b|\.pos@|seguranca|saude|educacao|semed|reitoria|algo@|dominio\.com/;
  const GENERIC = /^(contato|atendimento|faleconosco|falecom|fale|sac|relacionamento|estagio|estagios|carreira|comercial|info|informacoes|ola|oi)/;
  const accept = e => e.endsWith(domain) && !NEG.test(e) && (GENERIC.test(e.split('@')[0]) || ['agencia_privada', 'instituto'].includes(f.agency_type));
  const best = [...new Set([...(f.email ? [f.email] : []), ...agg.emails])].filter(accept).sort((a, b) => score(b) - score(a))[0];
  f.email = best || null;
  if (!f.instagram && agg.instagram.length) f.instagram = `@${agg.instagram[0]}`;
  d.extra.facebook = [...new Set(agg.facebook)].slice(0, 2);
  d.extra.linkedin = [...new Set(agg.linkedin)].slice(0, 2);
  d.extra.whatsapp = [...new Set(agg.whatsapp)].slice(0, 2);
  const digits = (f.phone || '').replace(/\D/g, '');
  if (d.extra.whatsapp.some(w => digits.length >= 10 && w.endsWith(digits.slice(-8)))) f.is_whatsapp = true;
}

// 3. Append extra contacts to description
for (const d of kept) {
  const bits = [];
  if (d.extra.whatsapp.length && !d.fields.is_whatsapp) bits.push(`WhatsApp: +${d.extra.whatsapp[0]}`);
  if (d.extra.facebook.length) bits.push(`Facebook: facebook.com/${d.extra.facebook[0]}`);
  if (d.extra.linkedin.length) bits.push(`LinkedIn: linkedin.com/${d.extra.linkedin[0]}`);
  if (bits.length) d.fields.description = `${d.fields.description} ${bits.join(' · ')}`;
}
save();
fs.writeFileSync(`${D}/plan_enriched.json`, JSON.stringify(plan, null, 1));
const f = kept.map(d => d.fields);
console.log('kept', f.length, '| site', f.filter(x => x.website).length, '| tel', f.filter(x => x.phone).length, '| ig', f.filter(x => x.instagram).length,
  '| email', f.filter(x => x.email).length);
