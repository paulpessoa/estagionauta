import { supabaseAdmin } from '../services/supabase.service.js';

export const addCandidaturaDefinition = {
  type: 'function' as const,
  function: {
    name: 'add_candidatura',
    description: 'Cadastra uma nova candidatura (vaga de estágio ou trabalho) no painel Kanban de candidaturas do usuário. Use esta ferramenta quando o usuário solicitar para cadastrar, adicionar ou salvar uma vaga nova ou encontrada por ele.',
    parameters: {
      type: 'object',
      properties: {
        company: { type: 'string', description: 'Nome da empresa contratante' },
        position: { type: 'string', description: 'Nome do cargo ou título da vaga (ex: "Desenvolvedor Front-end")' },
        status: { 
          type: 'string', 
          enum: ['interested', 'applied', 'interview', 'test', 'offer', 'rejected'],
          description: 'Status do processo seletivo: "interested" (Interessado), "applied" (Candidatura enviada/aplicado), "interview" (Entrevista agendada), "test" (Realizando testes), "offer" (Proposta recebida), "rejected" (Recusado). Padrão é "interested".'
        },
        description: { type: 'string', description: 'Descrição da vaga, requisitos ou perfil desejado' },
        salary: { type: 'string', description: 'Valor da bolsa-auxílio/salário mensal (ex: "R$ 1.500,00" ou "A combinar")' },
        location: { type: 'string', description: 'Localidade ou modelo de trabalho (ex: "São Paulo - Híbrido", "Remoto", etc.)' },
        notes: { type: 'string', description: 'Observações pessoais sobre a vaga ou empresa' },
      },
      required: ['company', 'position'],
    },
  },
};

export async function runAddCandidatura(userId: string, args: any) {
  try {
    const { company, position, status, description, salary, location, notes } = args;

    // Calcular progresso com base no status do Kanban
    let progress = 0;
    const currentStatus = status || 'interested';
    if (currentStatus === 'applied') progress = 20;
    else if (currentStatus === 'interview') progress = 40;
    else if (currentStatus === 'test') progress = 65;
    else if (currentStatus === 'offer') progress = 90;
    else if (currentStatus === 'rejected') progress = 100;

    const { data, error } = await supabaseAdmin
      .from('kanban_applications')
      .insert({
        user_id: userId,
        company,
        position,
        status: currentStatus,
        description: description || '',
        salary: salary || null,
        location: location || '',
        notes: notes || '',
        progress,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding candidature in tool:', error);
      return { error: `Erro ao cadastrar candidatura no banco: ${error.message}` };
    }

    return {
      success: true,
      message: 'Candidatura cadastrada com sucesso no painel Kanban!',
      candidatureId: data.id,
      company: data.company,
      position: data.position,
      status: data.status,
    };
  } catch (err: any) {
    console.error('Unexpected error in add_candidatura tool:', err);
    return { error: `Erro inesperado ao adicionar candidatura: ${err.message}` };
  }
}
