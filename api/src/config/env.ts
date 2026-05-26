import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform((val) => parseInt(val, 10)).default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GROQ_API_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SUCCESS_URL: z.string().url().optional(),
  STRIPE_CANCEL_URL: z.string().url().optional(),
  BREVO_API_KEY: z.string().optional(),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  OPENAI_API_KEY: z.string().min(1).optional(),
  STRIPE_PRICE_ASTRONAUTA_AVULSO: z.string().min(1),
  STRIPE_PRICE_COSMONAUTA_AVULSO: z.string().min(1),
  STRIPE_PRICE_COMANDANTE_AVULSO: z.string().min(1),
  STRIPE_PRICE_ASTRONAUTA_ASSINATURA: z.string().min(1),
  STRIPE_PRICE_COSMONAUTA_ASSINATURA: z.string().min(1),
  STRIPE_PRICE_COMANDANTE_ASSINATURA: z.string().min(1),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:', result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
};

export const env = parseEnv();
