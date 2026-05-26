import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

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
    console.log('Connected to database!')

    const sqlPath = path.resolve(process.cwd(), 'supabase/migrations/20260525000000_fix_authorize_function.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('Applying authorize function fix...')
    await client.query(sql)
    console.log('Applied successfully!')

  } catch (err: any) {
    console.error('Error:', err.message || err)
  } finally {
    await client.end()
  }
}

run()
