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
  console.log('Testing agency_reviews fetch query...')
  const { data, error } = await supabaseAdmin
    .from('agency_reviews')
    .select(`
      *,
      agencies (
        name
      ),
      user_profiles!agency_reviews_user_id_fkey (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('FETCH ERROR:', error)
  } else {
    console.log(`FETCH SUCCESS: Fetched ${data?.length || 0} reviews.`)
    if (data && data.length > 0) {
      console.log('First review sample:', JSON.stringify(data[0], null, 2))
    }
  }
}

run()
