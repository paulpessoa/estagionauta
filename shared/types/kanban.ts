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

export interface StatusHistoryEntry {
  status: 'interested' | 'applied' | 'test' | 'group_dynamics' | 'interview' | 'cultural_fit' | 'resource' | 'offer' | 'hired' | 'rejected';
  date: string;
}

export interface FeedbackEntry {
  author?: string;
  text: string;
  date: string;
}

export interface JobApplication {
  id: string;
  user_id?: string;
  company: string;
  position: string;
  status: 'interested' | 'applied' | 'test' | 'group_dynamics' | 'interview' | 'cultural_fit' | 'resource' | 'offer' | 'hired' | 'rejected';
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
  statusHistory?: StatusHistoryEntry[];
  feedbacks?: FeedbackEntry[];
  created_at?: string;
  updated_at?: string;
}
