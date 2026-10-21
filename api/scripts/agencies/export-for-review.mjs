// Export current agencies per UF so they can be reviewed one by one (by agents or people). READ-ONLY.
// Usage (from api/): node scripts/agencies/export-for-review.mjs [UF,UF,...]
// Writes ../data/agencias/db/<UF>.json — commit these so a cloud session (no DB access) can review them.
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env' });
const OUT = path.resolve('../data/agencias/db');
const UFS = (process.argv[2] || 'AC,AL,AM,AP,BA,CE,DF,ES,GO,MA,MG,MS,MT,PA,PB,PE,PI,PR,RJ,RN,RO,RR,RS,SC,SE,SP,TO').split(',');
// Public business data only: no created_by / verified_by / user ids.
const COLUMNS = 'id, name, description, email, phone, is_whatsapp, website, instagram, address, city, state, cep, logo_url, agency_type, status, is_verified, rating, total_reviews, updated_at';

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
fs.mkdirSync(OUT, { recursive: true });
for (const uf of UFS) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await s.from('agencies').select(COLUMNS).eq('state', uf).neq('status', 'rejected').order('name').range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  fs.writeFileSync(path.join(OUT, `${uf}.json`), JSON.stringify({ uf, exportado_em: new Date().toISOString(), total: rows.length, agencias: rows }, null, 1));
  console.log(uf, rows.length);
}
