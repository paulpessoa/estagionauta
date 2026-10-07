// Build the DB change plan. Usage: STATES=GO,MT,MS node plan.mjs <dir>
// reads candidates.json, siteinfo.json, backup.json, raw.json(existingMap); writes plan.json
import fs from 'fs';
const D = process.argv[2];
const read = f => JSON.parse(fs.readFileSync(`${D}/${f}`, 'utf8'));
const cands = read('candidates.json');
const site = fs.existsSync(`${D}/siteinfo.json`) ? read('siteinfo.json') : {};
const existing = read('backup.json');
const existingMap = read('raw.json').existingMap || {};
const REGION = new Set((process.env.STATES || '').split(','));
const TODAY = new Date().toLocaleDateString('pt-BR');

function distM(a, b) {
  if (a.latitude == null || b.latitude == null) return Infinity;
  const R = 6371000, toR = x => x * Math.PI / 180;
  const dLat = toR(b.latitude - a.latitude), dLng = toR(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.latitude)) * Math.cos(toR(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const byPlace = new Map(cands.map(c => [c.place_id, c]));

const claimed = new Map();
const decisions = [];
for (const row of existing) {
  let best = null, bestD = 60;
  for (const c of cands) {
    if (c.state !== row.state || !REGION.has(c.state)) continue;
    const d = distM(row, c);
    if (d < bestD) { bestD = d; best = c; }
  }
  if (!best && existingMap[row.id]) best = byPlace.get(existingMap[row.id]) || null;
  const realUf = (row.address || '').match(/ - ([A-Z]{2}),? \d{5}/)?.[1];
  if (!best && realUf && !REGION.has(realUf)) { decisions.push({ op: 'update', id: row.id, old: row.name, tier: 'discard', reason: `local real fica em ${realUf} (${row.address}), não em ${row.state}`, cand: null }); continue; }
  if (!best) { decisions.push({ op: 'update', id: row.id, old: row.name, tier: 'pending', reason: 'não localizado no Google Maps na revalidação — verificar manualmente', cand: null }); continue; }
  if (best.state !== row.state && best.state) { decisions.push({ op: 'update', id: row.id, old: row.name, tier: 'discard', reason: `local real fica em ${best.state} (${best.city}), não em ${row.state}`, cand: null }); continue; }
  if (claimed.has(best.place_id)) { decisions.push({ op: 'update', id: row.id, old: row.name, tier: 'discard', reason: 'duplicado de outro cadastro do mesmo local', cand: null }); continue; }
  claimed.set(best.place_id, row.id);
  if (best.tier === 'discard' && best.reason.startsWith('campus/instituição menor')) {
    best = { ...best, tier: 'pending', agency_type: 'faculdade', reason: 'instituição de ensino já cadastrada — verificar se tem central de estágios aberta ao público' };
  }
  decisions.push({ op: 'update', id: row.id, old: row.name, tier: best.tier, reason: best.reason, cand: best });
}
for (const c of cands) {
  if (claimed.has(c.place_id) || c.tier === 'discard' || !REGION.has(c.state)) continue;
  decisions.push({ op: 'insert', tier: c.tier, reason: c.reason, cand: c });
}

const TYPE_LABEL = { instituto: 'Instituto / agente de integração', agencia_privada: 'Agência de estágios privada', faculdade: 'Instituição de ensino', orgao_publico: 'Órgão público', fundacao: 'Fundação', consultoria: 'Consultoria', outro: 'Outro' };
function pickEmail(emails, website) {
  if (!emails?.length) return null;
  const host = website ? new URL(website).hostname.replace(/^www\./, '') : '';
  return emails.find(e => host && e.endsWith(host.split('.').slice(-3).join('.'))) || emails[0];
}
function payload(c, tier, reason) {
  const s = (c.website && site[c.website]) || {};
  const phoneDigits = (c.phone || '').replace(/\D/g, '');
  const isMobile = /^\d{2}9\d{8}$/.test(phoneDigits);
  const waMatches = (s.whatsapp || []).some(w => w.endsWith(phoneDigits.slice(-8)) && phoneDigits.length >= 10);
  const ig = s.instagram?.[0] ? `@${s.instagram[0]}` : null;
  const g = c.google_reviews ? `nota ${String(c.google_rating ?? '-').replace('.', ',')} no Google (${c.google_reviews} avaliações)` : 'sem avaliações no Google';
  const brand = c.brand ? `${c.brand} — unidade ${c.city}/${c.state}` : `${TYPE_LABEL[c.agency_type] || 'Organização'} em ${c.city}/${c.state}`;
  const parts = [`${brand}. Verificado em ${TODAY}: ${g}.`];
  if (tier !== 'approve') parts.push(`Pendente: ${reason}.`);
  if (c.maps_url) parts.push(`Google Maps: ${c.maps_url}`);
  return {
    name: c.name, city: c.city, state: c.state, cep: c.cep, address: c.address,
    latitude: c.latitude, longitude: c.longitude,
    phone: c.phone, website: c.website, instagram: ig, email: pickEmail(s.emails, c.website),
    is_whatsapp: waMatches || (isMobile && (s.whatsapp || []).length > 0),
    agency_type: c.agency_type || null,
    description: parts.join(' '),
    status: tier === 'approve' ? 'approved' : 'pending',
    verified_at: new Date().toISOString(),
    rating: 0, total_reviews: 0, logo_url: null,
  };
}
for (const d of decisions) {
  if (d.tier === 'discard') d.fields = { status: 'rejected', logo_url: null, rating: 0, total_reviews: 0, description: `Rejeitado na revalidação de ${TODAY}: ${d.reason}.` };
  else if (d.cand) d.fields = payload(d.cand, d.tier, d.reason);
  else d.fields = { status: 'pending', logo_url: null, rating: 0, total_reviews: 0, description: `Pendente: ${d.reason}.` };
}
fs.writeFileSync(`${D}/plan.json`, JSON.stringify(decisions, null, 1));
const cnt = {}; for (const d of decisions) { const k = `${d.op}:${d.fields.status}`; cnt[k] = (cnt[k] || 0) + 1; }
console.log(cnt);
