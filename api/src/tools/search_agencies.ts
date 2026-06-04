import { supabaseAdmin } from '../services/supabase.service.js';

export const searchAgenciesDefinition = {
  type: 'function' as const,
  function: {
    name: 'search_agencies',
    description: 'Busca e lista agências de estágio aprovadas com base em filtros de busca (nome/descrição), estado, cidade ou tipo de agência.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Termo de busca opcional (nome ou descrição da agência).',
        },
        state: {
          type: 'string',
          description: 'Sigla do estado opcional (ex: PE, SP).',
        },
        city: {
          type: 'string',
          description: 'Nome da cidade opcional (ex: Recife, São Paulo).',
        },
        agencyType: {
          type: 'string',
          enum: ['faculdade', 'consultoria', 'agencia_privada', 'orgao_publico', 'instituto', 'fundacao', 'outro'],
          description: 'Tipo da agência opcional.',
        },
      },
    },
  },
};

interface SearchAgenciesArgs {
  query?: string;
  state?: string;
  city?: string;
  agencyType?: string;
}

export async function runSearchAgencies(userId: string, args: SearchAgenciesArgs) {
  try {
    let dbQuery = supabaseAdmin
      .from('agencies')
      .select('id, name, description, email, phone, website, instagram, address, city, state, rating, total_reviews, agency_type, logo_url')
      .eq('status', 'approved');

    if (args.state) {
      dbQuery = dbQuery.ilike('state', args.state.trim());
    }

    if (args.city) {
      dbQuery = dbQuery.ilike('city', `%${args.city.trim()}%`);
    }

    if (args.agencyType) {
      dbQuery = dbQuery.eq('agency_type', args.agencyType);
    }

    const { data: agencies, error } = await dbQuery;

    if (error) {
      console.error('Error searching agencies:', error);
      return { error: 'Não foi possível buscar as agências.' };
    }

    // Client-side text filter for query
    let filtered = agencies || [];
    if (args.query) {
      const q = args.query.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q))
      );
    }

    return {
      success: true,
      count: filtered.length,
      agencies: filtered,
    };
  } catch (err: any) {
    return { error: `Erro ao buscar agências: ${err.message}` };
  }
}
