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

    // 1. Search in RLS Policies
    console.log('\n--- Searching RLS Policies ---')
    const policiesRes = await client.query(`
      SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'agency_reviews';
    `)
    policiesRes.rows.forEach(row => {
      console.log(`Policy: ${row.policyname} on ${row.tablename}`)
      console.log(`- Command: ${row.cmd}`)
      console.log(`- Roles: ${row.roles}`)
      console.log(`- Qual: ${row.qual}`)
      console.log(`- With Check: ${row.with_check}`)
    })

    // 2. Search in Triggers on agency_reviews
    console.log('\n--- Searching Triggers ---')
    const triggersRes = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table, action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'agency_reviews';
    `)
    triggersRes.rows.forEach(row => {
      console.log(`Trigger: ${row.trigger_name} on ${row.event_object_table}`)
      console.log(`- Event: ${row.event_manipulation}`)
      console.log(`- Action: ${row.action_statement}`)
    })

    // 3. Search for any object or function containing 'app_permission'
    console.log('\n--- Searching Functions and Triggers containing app_permission ---')
    const functionsRes = await client.query(`
      SELECT routine_schema, routine_name, routine_type, routine_definition
      FROM information_schema.routines
      WHERE routine_schema = 'public' 
        AND (routine_definition LIKE '%app_permission%' OR routine_name LIKE '%app_permission%');
    `)
    functionsRes.rows.forEach(row => {
      console.log(`Routine: ${row.routine_name} (${row.routine_type})`)
    })

    // 4. Search policy definitions for 'app_permission'
    console.log('\n--- Searching Policies containing app_permission ---')
    const policiesSearchRes = await client.query(`
      SELECT tablename, policyname, qual, with_check
      FROM pg_policies
      WHERE qual LIKE '%app_permission%' OR with_check LIKE '%app_permission%';
    `)
    policiesSearchRes.rows.forEach(row => {
      console.log(`Policy: ${row.policyname} on ${row.tablename}`)
      console.log(`- Qual: ${row.qual}`)
      console.log(`- With Check: ${row.with_check}`)
    })

  } catch (err: any) {
    console.error('Error during inspection:', err.message || err)
  } finally {
    await client.end()
  }
}

run()
