import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), 'api/.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const password = process.env.SUPABASE_DB_PASSWORD || 'zBrPAG7iklejNNq7'
const projectRef = 'ptogsfpkptzpuvdluxzf'
const host = 'aws-0-sa-east-1.pooler.supabase.com'
const connectionString = `postgres://postgres.${projectRef}:${password}@${host}:6543/postgres`

async function run() {
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    await client.connect()
    console.log('Connected!')

    const res = await client.query(`
      SELECT pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'authorize';
    `)

    if (res.rows.length > 0) {
      console.log('--- public.authorize Definition ---')
      console.log(res.rows[0].def)
    } else {
      console.log('Function public.authorize not found!')
    }

  } catch (err: any) {
    console.error('Error:', err.message || err)
  } finally {
    await client.end()
  }
}

run()
