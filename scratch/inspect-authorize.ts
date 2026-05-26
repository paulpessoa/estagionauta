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

    // 1. Get the source code of any function named 'authorize'
    const res = await client.query(`
      SELECT p.proname, pg_get_functiondef(p.oid) as def
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'authorize';
    `)

    res.rows.forEach(row => {
      console.log(`\n--- Function ${row.proname} ---`)
      console.log(row.def)
    })

    // 2. Also check table definition of role_permissions
    const columnsRes = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'role_permissions';
    `)
    console.log('\n--- Columns of role_permissions ---')
    console.log(columnsRes.rows)

  } catch (err: any) {
    console.error('Error:', err.message || err)
  } finally {
    await client.end()
  }
}

run()
