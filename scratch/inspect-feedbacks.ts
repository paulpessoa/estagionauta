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
    console.log('Connected to database!')

    // 1. Search in RLS Policies for feedbacks
    console.log('\n--- Searching RLS Policies for feedbacks ---')
    const policiesRes = await client.query(`
      SELECT schemaname, tablename, policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'feedbacks';
    `)
    policiesRes.rows.forEach(row => {
      console.log(`Policy: ${row.policyname} on ${row.tablename}`)
      console.log(`- Command: ${row.cmd}`)
      console.log(`- Qual: ${row.qual}`)
      console.log(`- With Check: ${row.with_check}`)
    })

    // 2. Select recent feedbacks to verify
    const feedbacksRes = await client.query('SELECT * FROM public.feedbacks LIMIT 5')
    console.log('\n--- Sample Feedbacks ---')
    console.log(feedbacksRes.rows)

  } catch (err: any) {
    console.error('Error:', err.message || err)
  } finally {
    await client.end()
  }
}

run()
