import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// Public dev-only key (also in .env.example). Never rely on it in production.
const DEV_BYOK_ENCRYPTION_KEY = 'e87e6fa50b69dc0ff46eaed3e75ca5fb495242b5da2946043eba523a837aa381';

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SUCCESS_URL: z.string().url().optional(),
  STRIPE_CANCEL_URL: z.string().url().optional(),
  BREVO_API_KEY: z.string().optional(),
  BREVO_SENDER_EMAIL: z.string().email().default('contato@estagionauta.com.br'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  STRIPE_PRICE_ASTRONAUTA_ASSINATURA: z.string().min(1),
  STRIPE_PRICE_COSMONAUTA_ASSINATURA: z.string().min(1),
  STRIPE_PRICE_ASTRONAUTA_AVULSO: z.string().min(1),
  STRIPE_PRICE_COSMONAUTA_AVULSO: z.string().min(1),
  STRIPE_PRICE_COMANDANTE_AVULSO: z.string().min(1).optional(),
  MENVO_NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  MENVO_NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  MENVO_SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  MENVO_SUPABASE_ACCESS_TOKEN: z.string().optional(),
  MENVO_JOTFORM_API_KEY: z.string().optional(),
  BYOK_ENCRYPTION_KEY: z.string().default(DEV_BYOK_ENCRYPTION_KEY),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables');
  }

  if (result.data.NODE_ENV === 'production' && result.data.BYOK_ENCRYPTION_KEY === DEV_BYOK_ENCRYPTION_KEY) {
    console.warn('[SECURITY] BYOK_ENCRYPTION_KEY is using the public dev default. Set a secret key in production.');
  }

  return result.data;
};

export const env = parseEnv();
