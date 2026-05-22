// scripts/add-credits.ts
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

async function addCredits() {
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
  const creditsToAdd = 5000;

  console.log(`Adicionando ${creditsToAdd} créditos...`);
  const { error: rpcError } = await supabaseAdmin.rpc('add_credits', {
    user_uuid: user.id,
    amount: creditsToAdd,
    description: 'Adicionando 5mil créditos via script de teste',
  });

  if (rpcError) {
    console.error('Erro ao chamar RPC add_credits:', rpcError);
    console.log('Tentando atualizar diretamente a tabela user_profiles...');
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({ credits: (user.credits || 0) + creditsToAdd })
      .eq('id', user.id)
      .select('credits')
      .single();

    if (updateError) {
      console.error('Erro ao atualizar créditos diretamente:', updateError);
      process.exit(1);
    }
    console.log(`Créditos atualizados diretamente com sucesso! Novos créditos: ${updatedProfile.credits}`);
  } else {
    // Buscar perfil novamente para confirmar
    const { data: updated } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', user.id)
      .single();
    console.log(`RPC executado com sucesso! Novos créditos: ${updated?.credits}`);
  }
}

addCredits().catch((e) => {
  console.error('Erro inesperado:', e);
  process.exit(1);
});
