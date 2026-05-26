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
  console.log('Fetching a comment to test...')
  const { data: comments, error: fetchError } = await supabaseAdmin
    .from('agency_comments')
    .select('id, content, status, moderation_reason')
    .limit(1)

  if (fetchError || !comments || comments.length === 0) {
    console.error('Error fetching comment:', fetchError)
    process.exit(1)
  }

  const comment = comments[0]
  console.log('Found comment:', comment)

  console.log('Attempting to update status to rejected...')
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('agency_comments')
    .update({
      status: 'rejected',
      moderation_reason: 'Violação das regras da comunidade (conteúdo inadequado ou ofensivo)',
      content: 'Conteúdo removido pelo moderador por violar as diretrizes da comunidade.'
    })
    .eq('id', comment.id)
    .select()

  if (updateError) {
    console.error('UPDATE ERROR:', updateError)
  } else {
    console.log('UPDATE SUCCESS:', updated)
    
    // Revert it back to original status to keep it clean
    console.log('Reverting comment to original status...')
    await supabaseAdmin
      .from('agency_comments')
      .update({
        status: comment.status,
        moderation_reason: comment.moderation_reason,
        content: comment.content
      })
      .eq('id', comment.id)
  }
}

run()
