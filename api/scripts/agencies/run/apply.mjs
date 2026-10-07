// Apply plan_enriched.json to Supabase. Run from api/. Usage: node apply.mjs <dir>
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env' });
const D = process.argv[2];
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const plan = JSON.parse(fs.readFileSync(`${D}/plan_enriched.json`, 'utf8'));
const CREATED_BY = '3b7ea4f4-3d51-45a5-a41f-de97cfb81296';

const results = [];
for (const d of plan) {
  if (d.op === 'update') {
    const { data, error } = await s.from('agencies').update(d.fields).eq('id', d.id).select('id');
    results.push({ op: 'update', id: d.id, ok: !error, missing: !data?.length, error: error?.message });
    continue;
  }
  const { data, error } = await s.from('agencies').insert({ ...d.fields, created_by: CREATED_BY }).select('id').single();
  d.id = data?.id;
  results.push({ op: 'insert', id: data?.id, name: d.fields.name, ok: !error, error: error?.message });
}
const { data: leaked, error: leakErr } = await s.from('agencies').update({ logo_url: null }).ilike('logo_url', '%key=%').select('id');

fs.writeFileSync(`${D}/plan_applied.json`, JSON.stringify(plan, null, 1));
fs.writeFileSync(`${D}/apply_results.json`, JSON.stringify(results, null, 1));
const count = (op, k) => results.filter(r => r.op === op && r[k]).length;
console.log('updates ok', count('update', 'ok'), '| inserts ok', count('insert', 'ok'), '| missing', results.filter(r => r.missing).length,
  '| failures', results.filter(r => !r.ok).length, '| logo_url cleared', leaked?.length ?? leakErr?.message);
for (const f of results.filter(r => !r.ok).slice(0, 10)) console.log(f);
