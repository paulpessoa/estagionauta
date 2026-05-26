import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from api/.env
dotenv.config({ path: path.resolve(process.cwd(), 'api/.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function run() {
  const { data, error } = await supabase
    .from('agency_comments')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching comments:', error)
  } else {
    console.log('Columns in agency_comments:', Object.keys(data[0] || {}))
  }
}

run()
