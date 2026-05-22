// scripts/setup-test-env.ts
// Utility to reset the test user's credits before running Playwright tests.
// Run with: ts-node scripts/setup-test-env.ts

import { supabaseAdmin } from '../api/src/services/supabase.service.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const TEST_EMAIL = process.env.TEST_USER_EMAIL as string;
const INITIAL_CREDITS = 20; // give enough credits for tests

async function resetCredits() {
  // Sign in to get the user id (requires service role key in supabaseAdmin)
  const { data: user, error: userErr } = await supabaseAdmin
    .from('user_profiles')
    .select('id')
    .eq('email', TEST_EMAIL)
    .single();

  if (userErr || !user) {
    console.error('Failed to locate test user:', userErr);
    process.exit(1);
  }

  const userId = user.id;
  // Reset credits via add_credits RPC (adds on top of existing). For deterministic state,
  // we first set credits to 0 using a direct update, then add the desired amount.
  await supabaseAdmin
    .from('user_profiles')
    .update({ credits: 0, total_credits_used: 0, total_credits_purchased: 0 })
    .eq('id', userId);

  await supabaseAdmin.rpc('add_credits', {
    user_uuid: userId,
    amount: INITIAL_CREDITS,
    description: 'Test reset',
  });

  console.log(`Test user ${TEST_EMAIL} credits reset to ${INITIAL_CREDITS}`);
}

resetCredits().catch((e) => {
  console.error('Unexpected error resetting credits:', e);
  process.exit(1);
});
