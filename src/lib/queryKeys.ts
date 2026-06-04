export const queryKeys = {
  // Domínio de Perfil do Usuário
  profile: {
    all: ['profile'] as const,
    detail: (userId: string) => [...queryKeys.profile.all, userId] as const,
  },
  
  // Domínio de Créditos e Transações
  credits: {
    all: ['credits'] as const,
  },
  
  // Domínio de Candidaturas (Kanban)
  candidatures: {
    all: ['candidatures'] as const,
  },
  
  // Domínio de Agências Integradoras
  agencies: {
    all: ['agencies'] as const,
  },

  // Domínio de Indicações/Referrals
  referrals: {
    all: ['referrals'] as const,
  }
} as const;

export type QueryDomain = keyof typeof queryKeys;
