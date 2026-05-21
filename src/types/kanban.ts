export * from '../../shared/types/kanban';

export const statusConfig = {
  interested: { label: 'Interessado', color: 'bg-gray-100 text-gray-800' },
  applied: { label: 'Candidatado', color: 'bg-blue-100 text-blue-800' },
  interview: { label: 'Entrevista', color: 'bg-yellow-100 text-yellow-800' },
  test: { label: 'Teste', color: 'bg-purple-100 text-purple-800' },
  offer: { label: 'Proposta', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Recusado', color: 'bg-red-100 text-red-800' }
} as const;