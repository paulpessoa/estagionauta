// scripts/test-consume.ts
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.TEST_USER_EMAIL || 'paulmspessoa@gmail.com';

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

async function testConsume() {
  console.log(`Buscando usuário por email: ${email}...`);
  const { data: user, error: userErr } = await supabaseAdmin
    .from('user_profiles')
    .select('id, credits')
    .eq('email', email)
    .single();

  if (userErr || !user) {
    console.error('Erro ao localizar perfil do usuário:', userErr);
    process.exit(1);
  }

  console.log(`Usuário encontrado: ID = ${user.id}, Créditos atuais = ${user.credits}`);

  console.log('Testando chamada do RPC consume_credits com a service role key...');
  const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('consume_credits', {
    user_uuid: user.id,
    amount: 1,
    description: 'Teste de consumo de créditos via script',
  });

  if (rpcError) {
    console.error('Erro retornado pelo RPC consume_credits:', rpcError);
  } else {
    console.log(`Sucesso! Resultado do RPC: ${rpcResult}`);
    
    // Buscar perfil novamente para confirmar decremento
    const { data: updated } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();
    console.log(`Novos créditos no perfil: ${updated?.credits}`);
  }
}

testConsume().catch((e) => {
  console.error('Erro inesperado:', e);
  process.exit(1);
});
