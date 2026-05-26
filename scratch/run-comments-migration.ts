import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from api/.env
dotenv.config({ path: path.resolve(process.cwd(), 'api/.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const password = process.env.SUPABASE_DB_PASSWORD || 'zBrPAG7iklejNNq7'
const projectRef = 'ptogsfpkptzpuvdluxzf'

async function run() {
  const host = `aws-0-sa-east-1.pooler.supabase.com`
  // Redact password in connection string log
  const connectionString = `postgres://postgres.${projectRef}:${password}@${host}:6543/postgres`

  console.log(`Connecting to: aws-0-sa-east-1.pooler.supabase.com:6543...`)
  
  const client = new pg.Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // This will bypass the self-signed cert validation
    }
  })

  try {
    await client.connect()
    console.log('Connected to Supabase PostgreSQL database!')

    console.log('Running DDL migrations...')
    await client.query(`
      ALTER TABLE public.agency_comments 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';
    `)
    console.log('Column "status" added or already exists on "agency_comments" table.')

    await client.query(`
      ALTER TABLE public.agency_comments 
      ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
    `)
    console.log('Column "moderation_reason" added or already exists on "agency_comments" table.')

    const res = await client.query('SELECT count(*) FROM public.agency_comments')
    console.log(`Current comments count: ${res.rows[0].count}`)

    console.log('Migration completed successfully!')
  } catch (err: any) {
    console.error('Error running migration:', err.message || err)
  } finally {
    await client.end()
  }
}

run()
