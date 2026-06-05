import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';
import { env } from '../config/env.js';
import { supabaseAdmin } from './supabase.service.js';

const ALGORITHM = 'aes-256-gcm';

const getEncryptionKey = (): Buffer => {
  // Derives a safe 32-byte key from the configured BYOK_ENCRYPTION_KEY env var
  return createHash('sha256').update(env.BYOK_ENCRYPTION_KEY).digest();
};

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
}

/**
 * Encrypts a string using AES-256-GCM
 */
export function encrypt(text: string): EncryptedData {
  const iv = randomBytes(12); // Standard IV size for GCM is 12 bytes
  const key = getEncryptionKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * Decrypts a string using AES-256-GCM
 */
export function decrypt(ciphertext: string, ivHex: string, tagHex: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Fetches and decrypts custom API keys for a given user.
 */
export async function getUserDecryptedKeys(userId: string): Promise<{ geminiKey?: string; openaiKey?: string }> {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('encrypted_gemini_key, gemini_key_iv, gemini_key_tag, encrypted_openai_key, openai_key_iv, openai_key_tag')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return {};
    }

    const keys: { geminiKey?: string; openaiKey?: string } = {};

    if (profile.encrypted_gemini_key && profile.gemini_key_iv && profile.gemini_key_tag) {
      try {
        keys.geminiKey = decrypt(profile.encrypted_gemini_key, profile.gemini_key_iv, profile.gemini_key_tag);
      } catch (err) {
        console.error('Failed to decrypt Gemini key for user:', userId, err);
      }
    }

    if (profile.encrypted_openai_key && profile.openai_key_iv && profile.openai_key_tag) {
      try {
        keys.openaiKey = decrypt(profile.encrypted_openai_key, profile.openai_key_iv, profile.openai_key_tag);
      } catch (err) {
        console.error('Failed to decrypt OpenAI key for user:', userId, err);
      }
    }

    return keys;
  } catch (err) {
    console.error('Error fetching/decrypting user keys:', err);
    return {};
  }
}

