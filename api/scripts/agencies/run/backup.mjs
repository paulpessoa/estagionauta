// Usage: STATES=GO,MT,MS node backup.mjs <dir>  (run from api/)
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env' });
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await s.from('agencies').select('*').in('state', process.env.STATES.split(',')).range(from, from + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}
fs.writeFileSync(`${process.argv[2]}/backup.json`, JSON.stringify(rows, null, 1));
console.log('backed up', rows.length);
