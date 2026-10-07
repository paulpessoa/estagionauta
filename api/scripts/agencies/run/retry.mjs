// Re-apply only failed rows from a previous apply. Run from api/. Usage: node retry.mjs <dir>
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env' });
const D = process.argv[2];
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const plan = JSON.parse(fs.readFileSync(`${D}/plan_applied.json`, 'utf8'));
const results = JSON.parse(fs.readFileSync(`${D}/apply_results.json`, 'utf8'));
const CREATED_BY = '3b7ea4f4-3d51-45a5-a41f-de97cfb81296';
let fixed = 0, still = 0;
for (let i = 0; i < plan.length; i++) {
  if (results[i].ok) continue;
  const d = plan[i];
  for (let a = 0; a < 3; a++) {
    try {
      let error;
      if (d.op === 'update') ({ error } = await s.from('agencies').update(d.fields).eq('id', d.id));
      else ({ error } = await s.from('agencies').insert({ ...d.fields, created_by: CREATED_BY }));
      if (!error) { results[i] = { ...results[i], ok: true, error: undefined }; fixed++; break; }
    } catch { await new Promise(r => setTimeout(r, 2000)); }
    if (a === 2) still++;
  }
}
fs.writeFileSync(`${D}/apply_results.json`, JSON.stringify(results, null, 1));
console.log(D, 'recuperadas', fixed, '| ainda falhando', still, '| total falhas antes', results.length);
