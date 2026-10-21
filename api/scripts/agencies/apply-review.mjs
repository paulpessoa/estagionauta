// Apply per-record review decisions (../data/agencias/review/<UF>.json) to the agencies table.
// Usage (from api/): node scripts/agencies/apply-review.mjs <UF,UF,...> [--apply]
// Without --apply it only prints what would change (dry run). With --apply it backs up the touched rows first.
// "rejeitar" never deletes: it sets status = 'rejected' (reversible), like the regional pipeline.
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });
const UFS = (process.argv[2] || '').split(',').filter(Boolean);
const APPLY = process.argv.includes('--apply');
const REVIEW_DIR = path.resolve('../data/agencias/review');
const OUT_DIR = path.resolve('scripts/agencies/output-review');
const CREATED_BY = process.env.REVIEW_CREATED_BY || '3b7ea4f4-3d51-45a5-a41f-de97cfb81296';
const EDITABLE = ['name', 'description', 'email', 'phone', 'is_whatsapp', 'website', 'instagram', 'address', 'city', 'cep', 'logo_url', 'agency_type'];
const TODAY = new Date().toLocaleDateString('pt-BR');
if (!UFS.length) { console.error('Informe as UFs, ex.: node apply-review.mjs PE,PB'); process.exit(1); }

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const uf of UFS) {
  const review = JSON.parse(fs.readFileSync(path.join(REVIEW_DIR, `${uf}.json`), 'utf8'));
  const ids = review.decisoes.map(d => d.id);
  const { data: current, error } = await s.from('agencies').select('*').in('id', ids);
  if (error) throw error;
  const byId = new Map(current.map(r => [r.id, r]));
  if (APPLY) fs.writeFileSync(path.join(OUT_DIR, `backup-${uf}-${Date.now()}.json`), JSON.stringify(current, null, 1));

  const ops = [];
  for (const d of review.decisoes) {
    const row = byId.get(d.id);
    if (!row) { ops.push({ id: d.id, skip: 'id não existe mais no banco' }); continue; }
    if (d.acao === 'rejeitar') {
      ops.push({ id: d.id, name: row.name, fields: { status: 'rejected', description: `Rejeitado na revisão de ${TODAY}: ${d.motivo}` } });
    } else if (d.acao === 'atualizar') {
      // Only fill or fix fields that have evidence; never blank a field that has a value.
      const fields = Object.fromEntries(Object.entries(d.campos || {}).filter(([k, v]) => EDITABLE.includes(k) && v != null && v !== row[k]));
      if (Object.keys(fields).length) ops.push({ id: d.id, name: row.name, fields: { ...fields, verified_at: new Date().toISOString() } });
    } else if (d.acao === 'manter') {
      ops.push({ id: d.id, name: row.name, fields: { verified_at: new Date().toISOString() } });
    }
    // 'revisar_humano' is left untouched on purpose.
  }
  for (const n of review.novas || []) {
    const fields = Object.fromEntries(Object.entries(n).filter(([k]) => EDITABLE.includes(k)));
    ops.push({ insert: true, name: n.name, fields: { ...fields, state: uf, status: 'pending', created_by: CREATED_BY } });
  }

  console.log(`\n== ${uf}: ${ops.length} operações ${APPLY ? '' : '(dry run)'}`);
  for (const op of ops) {
    if (op.skip) { console.log(`  pular ${op.id}: ${op.skip}`); continue; }
    console.log(`  ${op.insert ? 'inserir' : op.fields.status === 'rejected' ? 'rejeitar' : 'atualizar'} ${op.name}: ${Object.keys(op.fields).join(', ')}`);
    if (!APPLY) continue;
    const res = op.insert
      ? await s.from('agencies').insert(op.fields).select('id').single()
      : await s.from('agencies').update(op.fields).eq('id', op.id).select('id');
    if (res.error) console.log(`    ERRO: ${res.error.message}`);
  }
}
