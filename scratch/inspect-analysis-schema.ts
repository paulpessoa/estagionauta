import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env variables
dotenv.config({ path: path.resolve(process.cwd(), 'api/.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in api/.env')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function run() {
  console.log('Fetching database schema info for curriculum_analysis...')
  
  // Select 1 row to see keys
  const { data: rows, error: selectError } = await supabaseAdmin
    .from('curriculum_analysis')
    .select('*')
    .limit(1)

  if (selectError) {
    console.error('Error fetching curriculum_analysis:', selectError)
    process.exit(1)
  }

  console.log('Columns in curriculum_analysis:', Object.keys(rows[0] || {}))
  console.log('Sample row:', rows[0])
}

run()
