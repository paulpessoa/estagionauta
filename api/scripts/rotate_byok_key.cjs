// Re-encrypts users' BYOK keys (Gemini/OpenAI) from OLD_BYOK_KEY to NEW_BYOK_KEY.
// Same algorithm as src/services/crypto.service.ts (AES-256-GCM, key = sha256(secret)).
//
// Usage (dry run by default — nothing is written):
//   OLD_BYOK_KEY=<current> NEW_BYOK_KEY=<new> node scripts/rotate_byok_key.cjs
//   OLD_BYOK_KEY=<current> NEW_BYOK_KEY=<new> node scripts/rotate_byok_key.cjs --apply
//
// After --apply, set BYOK_ENCRYPTION_KEY=<new> on Cloud Run right away.
// Generate a new key with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const path = require('path');
const { createCipheriv, createDecipheriv, createHash, randomBytes } = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { OLD_BYOK_KEY, NEW_BYOK_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
const APPLY = process.argv.includes('--apply');
const PROVIDERS = ['gemini', 'openai'];

if (!OLD_BYOK_KEY || !NEW_BYOK_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing OLD_BYOK_KEY, NEW_BYOK_KEY, SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const keyOf = (secret) => createHash('sha256').update(secret).digest();

function decrypt(secret, ciphertext, ivHex, tagHex) {
  const decipher = createDecipheriv('aes-256-gcm', keyOf(secret), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return decipher.update(ciphertext, 'hex', 'utf8') + decipher.final('utf8');
}

function encrypt(secret, text) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyOf(secret), iv);
  const ciphertext = cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
  return { ciphertext, iv: iv.toString('hex'), tag: cipher.getAuthTag().toString('hex') };
}

async function run() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: profiles, error } = await supabase
    .from('user_profiles')
    .select('id, encrypted_gemini_key, gemini_key_iv, gemini_key_tag, encrypted_openai_key, openai_key_iv, openai_key_tag')
    .or('encrypted_gemini_key.not.is.null,encrypted_openai_key.not.is.null');
  if (error) throw error;

  let ok = 0;
  let failed = 0;
  for (const profile of profiles) {
    const update = {};
    for (const p of PROVIDERS) {
      const ct = profile[`encrypted_${p}_key`];
      if (!ct) continue;
      try {
        const plain = decrypt(OLD_BYOK_KEY, ct, profile[`${p}_key_iv`], profile[`${p}_key_tag`]);
        const next = encrypt(NEW_BYOK_KEY, plain);
        update[`encrypted_${p}_key`] = next.ciphertext;
        update[`${p}_key_iv`] = next.iv;
        update[`${p}_key_tag`] = next.tag;
      } catch {
        failed++;
        console.warn(`Could not decrypt ${p} key for user ${profile.id} with OLD_BYOK_KEY — skipped`);
      }
    }
    if (Object.keys(update).length === 0) continue;
    if (APPLY) {
      const { error: upErr } = await supabase.from('user_profiles').update(update).eq('id', profile.id);
      if (upErr) throw upErr;
    }
    ok++;
  }

  console.log(`${APPLY ? 'Re-encrypted' : '[dry run] Would re-encrypt'} ${ok} profile(s); ${failed} key(s) failed to decrypt.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
