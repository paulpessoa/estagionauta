export interface Reminder {
  id: string
  title: string
  description: string
  date: Date
  completed: boolean
  type: 'call' | 'email' | 'test' | 'interview' | 'follow-up' | 'deadline'
}

export interface JobApplication {
  id: string
  company: string
  position: string
  status: 'interested' | 'applied' | 'interview' | 'test' | 'offer' | 'rejected'
  appliedDate: Date
  description: string
  salary?: string
  location: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  website?: string
  progress: number
  nextAction?: string
  nextActionDate?: Date
  reminders: Reminder[]
  notes: string
  imageUrl?: string
  tags: string[]
}

export const statusConfig = {
  interested: { label: 'Interessado', color: 'bg-gray-100 text-gray-800' },
  applied: { label: 'Candidatado', color: 'bg-blue-100 text-blue-800' },
  interview: { label: 'Entrevista', color: 'bg-yellow-100 text-yellow-800' },
  test: { label: 'Teste', color: 'bg-purple-100 text-purple-800' },
  offer: { label: 'Proposta', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Recusado', color: 'bg-red-100 text-red-800' }
} as const 