
// Environment variables validation
export const env = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  MODE: import.meta.env.MODE || 'development',
}

// Função para verificar se uma variável específica está configurada
export const isEnvConfigured = (envVar: keyof typeof env): boolean => {
  return !!env[envVar]
}

// Função para verificar se o Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  return !!(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)
}

// Função para verificar se a OpenAI está configurada
export const isOpenAIConfigured = (): boolean => {
  return !!env.VITE_OPENAI_API_KEY
}

// Validação não-bloqueante - apenas warnings
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
]

const missingVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar])

if (missingVars.length > 0) {
  console.warn('Variáveis de ambiente ausentes (algumas funcionalidades podem estar desabilitadas):', missingVars)
  console.warn('Para configurar o Supabase, crie um arquivo .env.local com as variáveis necessárias. Veja .env.example para referência.')
}

// Optional environment variables - warn if missing
const optionalEnvVars = [
  'VITE_OPENAI_API_KEY'
]

for (const envVar of optionalEnvVars) {
  if (!import.meta.env[envVar]) {
    console.warn(`Variável de ambiente opcional ausente: ${envVar}`)
  }
}
