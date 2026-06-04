import { supabaseAdmin } from '../services/supabase.service.js';

export const submitAgencyReviewDefinition = {
  type: 'function' as const,
  function: {
    name: 'submit_agency_review',
    description: 'Envia uma avaliação (nota de 1 a 5 estrelas e comentário) para uma agência de estágio. O comentário precisa ter pelo menos 20 caracteres.',
    parameters: {
      type: 'object',
      properties: {
        agencyId: {
          type: 'string',
          description: 'ID da agência a ser avaliada (UUID).',
        },
        rating: {
          type: 'integer',
          minimum: 1,
          maximum: 5,
          description: 'Nota de 1 a 5 estrelas.',
        },
        comment: {
          type: 'string',
          description: 'Comentário justificando a nota (mínimo 20 caracteres, máximo 1000).',
        },
      },
      required: ['agencyId', 'rating', 'comment'],
    },
  },
};

interface SubmitAgencyReviewArgs {
  agencyId: string;
  rating: number;
  comment: string;
}

export async function runSubmitAgencyReview(userId: string, args: SubmitAgencyReviewArgs) {
  const { agencyId, rating, comment } = args;

  if (!agencyId || !rating || !comment) {
    return { error: 'Campos obrigatórios ausentes: agencyId, rating e comment são necessários.' };
  }

  if (rating < 1 || rating > 5) {
    return { error: 'A nota deve estar entre 1 e 5.' };
  }

  const cleanComment = comment.trim();
  if (cleanComment.length < 20) {
    return { error: 'O comentário da avaliação deve ter no mínimo 20 caracteres.' };
  }

  if (cleanComment.length > 1000) {
    return { error: 'O comentário da avaliação deve ter no máximo 1000 caracteres.' };
  }

  try {
    // 1. Double check if already reviewed
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('agency_reviews')
      .select('id')
      .eq('agency_id', agencyId)
      .eq('user_id', userId)
      .limit(1);

    if (checkError) {
      console.error('Error checking previous reviews:', checkError);
    }

    if (existing && existing.length > 0) {
      return { error: 'Você já enviou uma avaliação para esta agência. Só é permitida uma avaliação por usuário/agência.' };
    }

    // 2. Insert the review
    const { error: insertError } = await supabaseAdmin
      .from('agency_reviews')
      .insert({
        agency_id: agencyId,
        user_id: userId,
        rating,
        comment: cleanComment,
        justification: cleanComment,
        status: 'pending',
        is_moderated: false,
      });

    if (insertError) {
      console.error('Error inserting review:', insertError);
      return { error: 'Não foi possível salvar a avaliação.' };
    }

    return {
      success: true,
      message: 'Avaliação enviada com sucesso! Ela passará pela moderação antes de ser publicada.',
    };
  } catch (err: any) {
    return { error: `Erro ao enviar avaliação: ${err.message}` };
  }
}
