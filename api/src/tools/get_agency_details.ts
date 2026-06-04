import { supabaseAdmin } from '../services/supabase.service.js';

export const getAgencyDetailsDefinition = {
  type: 'function' as const,
  function: {
    name: 'get_agency_details',
    description: 'Recupera informações detalhadas e avaliações aprovadas de uma agência específica por ID.',
    parameters: {
      type: 'object',
      properties: {
        agencyId: {
          type: 'string',
          description: 'ID único da agência (UUID).',
        },
      },
      required: ['agencyId'],
    },
  },
};

interface GetAgencyDetailsArgs {
  agencyId: string;
}

export async function runGetAgencyDetails(userId: string, args: GetAgencyDetailsArgs) {
  const { agencyId } = args;

  if (!agencyId) {
    return { error: 'O ID da agência é obrigatório.' };
  }

  try {
    // 1. Fetch agency info
    const { data: agency, error: agencyErr } = await supabaseAdmin
      .from('agencies')
      .select('*')
      .eq('id', agencyId)
      .single();

    if (agencyErr || !agency) {
      console.error('Error fetching agency details:', agencyErr);
      return { error: 'Agência não encontrada.' };
    }

    // 2. Fetch approved reviews
    const { data: reviews, error: reviewsErr } = await supabaseAdmin
      .from('agency_reviews')
      .select('id, rating, comment, created_at')
      .eq('agency_id', agencyId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (reviewsErr) {
      console.error('Error fetching agency reviews:', reviewsErr);
    }

    return {
      success: true,
      agency,
      reviews: reviews || [],
    };
  } catch (err: any) {
    return { error: `Erro ao obter detalhes da agência: ${err.message}` };
  }
}
