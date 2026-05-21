export interface Reminder {
  id: string;
  application_id?: string;
  title: string;
  description: string;
  date: string;
  completed: boolean;
  type: 'call' | 'email' | 'test' | 'interview' | 'follow-up' | 'deadline';
  created_at?: string;
}

export interface JobApplication {
  id: string;
  user_id?: string;
  company: string;
  position: string;
  status: 'interested' | 'applied' | 'interview' | 'test' | 'offer' | 'rejected';
  appliedDate: string;
  description: string;
  salary?: string;
  location: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  progress: number;
  nextAction?: string;
  nextActionDate?: string;
  reminders: Reminder[];
  notes: string;
  imageUrl?: string;
  tags: string[];
  created_at?: string;
  updated_at?: string;
}
