export const navigateToDefinition = {
  type: 'function' as const,
  function: {
    name: 'navigate_to',
    description: 'Fornece o link/caminho de navegação correto para qualquer tela ou página do site quando o usuário solicitar para acessar, ver ou ir para alguma seção.',
    parameters: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          enum: ['perfil', 'configuracoes', 'candidaturas', 'simulador', 'gerador_curriculo', 'analise_curriculo', 'calculadora', 'indicar_amigos', 'precos'],
          description: 'A página de destino: "perfil" (Meu Perfil), "configuracoes" (Configurações da Conta), "candidaturas" (Kanban de Candidaturas), "simulador" (Simulador de Entrevistas), "gerador_curriculo" (Gerador de Currículos), "analise_curriculo" (Análise de Currículo por IA), "calculadora" (Calculadora de Recesso), "indicar_amigos" (Indicar Amigos/Convide amigos), "precos" (Gestão de Créditos / Comprar).'
        }
      },
      required: ['page']
    }
  }
};

export async function runNavigateTo(userId: string, args: { page: string }) {
  const { page } = args;

  const pagesMap: Record<string, { path: string; label: string }> = {
    perfil: { path: '/perfil', label: 'Meu Perfil' },
    configuracoes: { path: '/configuracoes', label: 'Configurações da Conta' },
    candidaturas: { path: '/candidaturas', label: 'Kanban de Candidaturas' },
    simulador: { path: '/simulador-entrevistas', label: 'Simulador de Entrevistas' },
    gerador_curriculo: { path: '/gerador-curriculos', label: 'Gerador de Currículos' },
    analise_curriculo: { path: '/analise-curriculo', label: 'Análise de Currículo por IA' },
    calculadora: { path: '/calculadora', label: 'Calculadora de Recesso' },
    indicar_amigos: { path: '/convide-amigos', label: 'Indicar Amigos / Recompensas' },
    precos: { path: '/precos', label: 'Comprar Créditos / Preços' }
  };

  const matched = pagesMap[page];

  if (!matched) {
    return { error: 'Página de destino desconhecida.' };
  }

  return {
    success: true,
    page: matched.label,
    path: matched.path,
    message: `Você pode acessar a página "${matched.label}" clicando no seguinte link: ${matched.path}`
  };
}
