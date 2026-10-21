// Compare the public reference lists (data/agencias/<UF>.json) with the `agencies` table. READ-ONLY.
// Usage (from api/): node scripts/agencies/reconcile-reference.mjs [UF,UF,...]
// Writes scripts/agencies/output-reconcile/report.md and report.json (gitignored).
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });
const REF_DIR = path.resolve('../data/agencias');
const OUT_DIR = path.resolve('scripts/agencies/output-reconcile');
const only = process.argv[2] ? new Set(process.argv[2].split(',')) : null;

const norm = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/\b(de|da|do|das|dos|e|unidade|agencia|centro|integracao|empresa|escola|ltda)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ').trim();
const domain = u => { try { return new URL(u.startsWith('http') ? u : `https://${u}`).hostname.replace(/^www\./, ''); } catch { return null; } };
const handle = ig => (ig || '').replace(/^.*instagram\.com\//, '').replace(/[@/]/g, '').toLowerCase() || null;
const digits = p => (p || '').replace(/\D/g, '').slice(-8) || null;
const tokens = s => new Set(norm(s).split(' ').filter(t => t.length > 2));
function similarity(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let hit = 0; for (const t of A) if (B.has(t)) hit++;
  return hit / Math.min(A.size, B.size);
}

function score(ref, row) {
  if (ref.instagram && handle(ref.instagram) === handle(row.instagram)) return 1;
  if (ref.phone && digits(ref.phone) === digits(row.phone)) return 0.95;
  const sameCity = norm(ref.city) === norm(row.city);
  const sameSite = ref.website && domain(ref.website) === domain(row.website);
  const nameSim = similarity(ref.name, row.name);
  if (sameSite && sameCity) return 0.9;
  return sameCity ? nameSim * 0.85 : nameSim * 0.5;
}

const refs = fs.readdirSync(REF_DIR).filter(f => /^[A-Z]{2}\.json$/.test(f))
  .map(f => JSON.parse(fs.readFileSync(path.join(REF_DIR, f), 'utf8')))
  .filter(r => !only || only.has(r.uf));

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function rowsFor(uf) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await s.from('agencies')
      .select('id, name, city, state, status, phone, website, instagram, address, agency_type')
      .eq('state', uf).range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

const report = [];
for (const ref of refs) {
  const rows = await rowsFor(ref.uf);
  const used = new Set();
  const missing = [], diverging = [], matched = [];
  for (const a of ref.agencias) {
    let best = null, bestScore = 0;
    for (const r of rows) { const sc = score(a, r); if (sc > bestScore) { bestScore = sc; best = r; } }
    if (!best || bestScore < 0.6) { missing.push(a); continue; }
    used.add(best.id);
    const diffs = [];
    if (best.status !== 'approved') diffs.push(`status no banco = ${best.status}`);
    for (const [k, eq] of [['phone', digits], ['website', domain], ['instagram', handle]]) {
      if (a[k] && eq(a[k]) !== eq(best[k])) diffs.push(`${k}: banco="${best[k] ?? ''}" referência="${a[k]}"`);
    }
    (diffs.length ? diverging : matched).push({ ref: a, db: best, diffs });
  }
  const unverified = rows.filter(r => r.status === 'approved' && !used.has(r.id));
  report.push({ uf: ref.uf, db_total: rows.length, ref_total: ref.agencias.length, missing, diverging, matched: matched.length, unverified });
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(report, null, 1));
const md = ['# Reconciliação referência × banco', '', `Gerado em ${new Date().toISOString()}`, ''];
for (const r of report) {
  md.push(`## ${r.uf} — banco: ${r.db_total} · referência: ${r.ref_total} · batem: ${r.matched}`, '');
  if (r.missing.length) md.push('**Faltam no banco (cadastrar ou aprovar):**', ...r.missing.map(a => `- ${a.name} (${a.city}) — ${a.status_validacao} — ${a.evidencias?.[0] ?? 'sem fonte'}`), '');
  if (r.diverging.length) md.push('**Divergências:**', ...r.diverging.map(d => `- ${d.db.name} [${d.db.id}]: ${d.diffs.join('; ')}`), '');
  if (r.unverified.length) md.push(`**Aprovadas no banco sem correspondência na referência (${r.unverified.length}) — revisar:**`, ...r.unverified.slice(0, 40).map(u => `- ${u.name} (${u.city ?? '?'}) [${u.id}]`), '');
}
fs.writeFileSync(path.join(OUT_DIR, 'report.md'), md.join('\n'));
console.log(report.map(r => `${r.uf}: faltam ${r.missing.length}, divergem ${r.diverging.length}, sem referência ${r.unverified.length}`).join('\n'));
console.log(`Relatório: ${path.join(OUT_DIR, 'report.md')}`);
