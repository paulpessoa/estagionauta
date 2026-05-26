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

    console.log('Adding RLS policy to feedbacks table for admins/moderators...')
    await client.query(`
      DROP POLICY IF EXISTS "Admins and moderators can view all feedbacks" ON public.feedbacks;
      CREATE POLICY "Admins and moderators can view all feedbacks" 
        ON public.feedbacks
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.role IN ('admin', 'moderator')
          )
        );
    `)
    console.log('Policy added successfully!')

    // Print active policies on feedbacks
    const policiesRes = await client.query(`
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'feedbacks';
    `)
    console.log('\nActive policies on feedbacks:')
    policiesRes.rows.forEach(row => {
      console.log(`- ${row.policyname}: Command ${row.cmd}`)
    })

  } catch (err: any) {
    console.error('Error:', err.message || err)
  } finally {
    await client.end()
  }
}

run()
