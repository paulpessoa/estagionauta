import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from api/.env
dotenv.config({ path: path.resolve(process.cwd(), 'api/.env') })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in api/.env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
})

async function run() {
  console.log('Seeding VAGGON agency and reviews...')

  // 1. Fetch a user profile to be the creator and reviewer
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, email')
    .limit(1)

  if (profilesError || !profiles || profiles.length === 0) {
    console.error('Error fetching user profiles or no user profiles exist. Please register a user first.', profilesError)
    process.exit(1)
  }

  const userId = profiles[0].id
  console.log(`Using user profile: ${profiles[0].email} (${userId})`)

  // 2. Check/Insert VAGGON Agency
  let { data: agency, error: agencyError } = await supabase
    .from('agencies')
    .select('*')
    .eq('name', 'VAGGON')
    .maybeSingle()

  if (agencyError) {
    console.error('Error fetching agency:', agencyError)
    process.exit(1)
  }

  if (!agency) {
    console.log('VAGGON agency not found, creating it...')
    const { data: newAgency, error: createError } = await supabase
      .from('agencies')
      .insert({
        name: 'VAGGON',
        description: 'Agência de Estágio VAGGON - Soluções Integradas',
        status: 'approved',
        agency_type: 'agencia_privada',
        is_verified: true,
        state: 'PE',
        city: 'Recife',
        address: 'Av. Cais do Apolo, 222 - Recife, PE',
        created_by: userId
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating agency:', createError)
      process.exit(1)
    }
    agency = newAgency
    console.log('VAGGON agency created successfully with ID:', agency.id)
  } else {
    console.log('VAGGON agency exists with ID:', agency.id)
  }

  // 3. Clear existing reviews for VAGGON so we start clean
  const { error: deleteReviewsError } = await supabase
    .from('agency_reviews')
    .delete()
    .eq('agency_id', agency.id)

  if (deleteReviewsError) {
    console.error('Error clearing old reviews:', deleteReviewsError)
  }

  // 4. Insert 3 reviews: pending, approved, rejected
  const reviewsToInsert = [
    {
      agency_id: agency.id,
      user_id: userId,
      rating: 3,
      title: 'Avaliação Pendente VAGGON',
      comment: 'Esta é uma avaliação pendente de teste para a agência VAGGON.',
      justification: 'Preciso de moderação para verificar se o texto atende às diretrizes.',
      status: 'pending',
      is_moderated: false
    },
    {
      agency_id: agency.id,
      user_id: userId,
      rating: 5,
      title: 'Excelente Agência!',
      comment: 'Esta é uma avaliação aprovada de teste. VAGGON me ajudou a conseguir meu primeiro estágio rapidamente. Excelente suporte e atendimento ao estudante.',
      justification: 'Atendimento rápido e processos transparentes.',
      status: 'approved',
      is_moderated: true,
      moderated_at: new Date().toISOString()
    },
    {
      agency_id: agency.id,
      user_id: userId,
      rating: 1,
      title: 'Avaliação Rejeitada',
      comment: 'Esta é uma avaliação rejeitada de teste. Contém ofensas desnecessárias ou informações falsas que violam as regras da plataforma.',
      justification: 'Comportamento inadequado no processo de seleção.',
      status: 'rejected',
      is_moderated: true,
      moderated_at: new Date().toISOString()
    }
  ]

  const { data: insertedReviews, error: insertError } = await supabase
    .from('agency_reviews')
    .insert(reviewsToInsert)
    .select()

  if (insertError) {
    console.error('Error inserting reviews:', insertError)
    process.exit(1)
  }

  console.log('Successfully seeded 3 reviews for VAGGON:', insertedReviews.map(r => `${r.title} (${r.status})`))
}

run()
