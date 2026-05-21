export interface SimulatorMessage {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: string;
}

export interface SimulatorFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  tips: string;
}

export interface InterviewSimulation {
  id: string;
  user_id: string;
  job_title: string;
  job_description: string | null;
  interviewer_type: string;
  status: 'started' | 'completed';
  messages: SimulatorMessage[];
  feedback: SimulatorFeedback | null;
  created_at: string;
  updated_at: string;
}

export interface StartSimulationRequest {
  job_title: string;
  job_description?: string;
  interviewer_type: string;
}

export interface AnswerSimulationRequest {
  answer: string;
}
