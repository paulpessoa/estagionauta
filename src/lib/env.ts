
// Environment variables validation
export const env = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  MODE: import.meta.env.MODE || 'development',
}

// Validate required environment variables
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
]

const missingVars = requiredEnvVars.filter(envVar => !import.meta.env[envVar])

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars)
  console.error('Please create a .env.local file with the required variables. See .env.example for reference.')
}

// Optional environment variables - warn if missing
const optionalEnvVars = [
  'VITE_OPENAI_API_KEY'
]

for (const envVar of optionalEnvVars) {
  if (!import.meta.env[envVar]) {
    console.warn(`Optional environment variable missing: ${envVar}`)
  }
}
