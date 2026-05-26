import app from '../api/src/app'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from api/.env and .env
dotenv.config({ path: path.resolve(process.cwd(), 'api/.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.SUPABASE_URL || 'https://ptogsfpkptzpuvdluxzf.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  console.error('VITE_SUPABASE_ANON_KEY must be set in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
})

async function run() {
  console.log('Logging in as test user to get admin JWT token...')
  const email = process.env.TEST_USER_EMAIL || 'paulmspessoa@gmail.com'
  const password = process.env.TEST_USER_PASSWORD || '@Citroen.123'

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (authError || !authData.session) {
    console.error('Failed to log in:', authError)
    process.exit(1)
  }

  const token = authData.session.access_token
  console.log('Successfully logged in! Token acquired.')

  // Fetch a comment to moderate
  console.log('Fetching a comment from database...')
  const { data: comments, error: commentsError } = await supabase
    .from('agency_comments')
    .select('id, content')
    .limit(1)

  if (commentsError || !comments || comments.length === 0) {
    console.error('Error fetching comments or no comments exist:', commentsError)
    process.exit(1)
  }

  const commentId = comments[0].id
  console.log(`Target comment ID: ${commentId}, content: "${comments[0].content}"`)

  // Construct request to Hono app using app.request()
  const path = `/api/admin/comments/${commentId}/moderate`
  console.log(`Sending PUT request to: ${path}...`)

  const res = await app.request(path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      status: 'rejected',
      reason: 'Violação das regras da comunidade (conteúdo inadequado ou ofensivo)'
    })
  })

  console.log('Hono response status:', res.status)
  const bodyText = await res.text()
  console.log('Hono response body:', bodyText)
}

run()
