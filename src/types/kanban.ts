export * from '../../shared/types/kanban';

export const statusConfig = {
  interested: { label: 'Interessado/Network', color: 'bg-gray-100 text-gray-800' },
  applied: { label: 'Candidato', color: 'bg-blue-100 text-blue-800' },
  test: { label: 'Teste', color: 'bg-purple-100 text-purple-800' },
  group_dynamics: { label: 'Dinâmica em Grupo', color: 'bg-indigo-100 text-indigo-800' },
  interview: { label: 'Entrevista', color: 'bg-yellow-100 text-yellow-800' },
  cultural_fit: { label: 'Fit Cultural', color: 'bg-orange-100 text-orange-800' },
  resource: { label: 'Recurso', color: 'bg-cyan-100 text-cyan-800' },
  offer: { label: 'Proposta', color: 'bg-green-100 text-green-800' },
  hired: { label: 'Contratado', color: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Reprovado/Feedback', color: 'bg-red-100 text-red-800' }
} as const;