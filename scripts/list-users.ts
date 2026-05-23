// scripts/list-users.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env.test');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function listUsers() {
  console.log('Buscando perfis de usuário...');
  const { data: users, error } = await supabaseAdmin
    .from('user_profiles')
    .select('id, email, full_name, credits, role')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Erro ao buscar perfis:', error);
    process.exit(1);
  }

  console.log('--- Perfis Encontrados (últimos 30) ---');
  users.forEach((u) => {
    console.log(`ID: ${u.id} | Email: ${u.email} | Nome: ${u.full_name} | Créditos: ${u.credits} | Role: ${u.role}`);
  });
}

listUsers().catch((e) => {
  console.error('Erro inesperado:', e);
  process.exit(1);
});
