import { supabaseAdmin } from '../services/supabase.service.js';

export const createAgencyDefinition = {
  type: 'function' as const,
  function: {
    name: 'create_agency',
    description: 'Cadastra ou sugere uma nova agência de integração de estágio na plataforma. Ela ficará pendente de aprovação pelos administradores.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome da agência (ex: CIEE Pernambuco).',
        },
        description: {
          type: 'string',
          description: 'Breve descrição sobre a agência e seus serviços.',
        },
        email: {
          type: 'string',
          description: 'E-mail de contato da agência.',
        },
        phone: {
          type: 'string',
          description: 'Telefone de contato da agência.',
        },
        cep: {
          type: 'string',
          description: 'CEP do endereço (opcional).',
        },
        address: {
          type: 'string',
          description: 'Logradouro, número, bairro.',
        },
        city: {
          type: 'string',
          description: 'Nome da cidade.',
        },
        state: {
          type: 'string',
          maxLength: 2,
          description: 'Sigla do estado com 2 letras (ex: PE).',
        },
        agencyType: {
          type: 'string',
          enum: ['faculdade', 'consultoria', 'agencia_privada', 'orgao_publico', 'instituto', 'fundacao', 'outro'],
          description: 'Tipo da agência.',
        },
        website: {
          type: 'string',
          description: 'Link do site da agência (opcional).',
        },
        instagram: {
          type: 'string',
          description: 'Perfil no Instagram (opcional).',
        },
        latitude: {
          type: 'number',
          description: 'Coordenada de latitude opcional.',
        },
        longitude: {
          type: 'number',
          description: 'Coordenada de longitude opcional.',
        },
      },
      required: ['name', 'description', 'email', 'phone', 'address', 'city', 'state', 'agencyType'],
    },
  },
};

interface CreateAgencyArgs {
  name: string;
  description: string;
  email: string;
  phone: string;
  cep?: string;
  address: string;
  city: string;
  state: string;
  agencyType: string;
  website?: string;
  instagram?: string;
  latitude?: number;
  longitude?: number;
}

export async function runCreateAgency(userId: string, args: CreateAgencyArgs) {
  const {
    name,
    description,
    email,
    phone,
    cep,
    address,
    city,
    state,
    agencyType,
    website,
    instagram,
    latitude,
    longitude,
  } = args;

  // Validations
  if (!name || !description || !email || !phone || !address || !city || !state || !agencyType) {
    return { error: 'Campos obrigatórios ausentes. Verifique nome, descrição, email, telefone, endereço, cidade, estado e tipo de agência.' };
  }

  const cleanState = state.trim().toUpperCase();
  if (cleanState.length !== 2) {
    return { error: 'O estado deve ser informado como uma sigla de 2 caracteres (ex: PE, SP).' };
  }

  try {
    const { data: newAgency, error } = await supabaseAdmin
      .from('agencies')
      .insert({
        name: name.trim(),
        description: description.trim(),
        email: email.trim(),
        phone: phone.trim(),
        cep: cep ? cep.trim() : null,
        address: address.trim(),
        city: city.trim(),
        state: cleanState,
        agency_type: agencyType,
        website: website ? website.trim() : null,
        instagram: instagram ? instagram.trim() : null,
        latitude: latitude || null,
        longitude: longitude || null,
        status: 'pending',
        created_by: userId,
      })
      .select('id, name')
      .single();

    if (error) {
      console.error('Error inserting agency:', error);
      return { error: 'Não foi possível cadastrar a agência no banco de dados.' };
    }

    return {
      success: true,
      message: `Agência "${newAgency.name}" cadastrada com sucesso! Ela ficará oculta até ser avaliada e aprovada pelos administradores.`,
      agencyId: newAgency.id,
    };
  } catch (err: any) {
    return { error: `Erro ao cadastrar agência: ${err.message}` };
  }
}
