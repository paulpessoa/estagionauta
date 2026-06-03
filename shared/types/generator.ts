export interface ResumeExperience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface ResumeEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export interface ResumeProject {
  name: string;
  description: string;
  url?: string | null;
}

export interface ResumeExtracurricular {
  name: string;
  institution?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}

export interface ResumeProfileData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website?: string | null;
  linkedin?: string | null;
  github?: string | null;
  summary: string;
  experiences: ResumeExperience[];
  education: ResumeEducation[];
  projects?: ResumeProject[];
  extracurriculars?: ResumeExtracurricular[];
  skills: string[];
  languages?: string[];
  jobTitle?: string | null;
  jobDescription?: string | null;
}

export interface GeneratedResume {
  id: string;
  userId: string;
  title: string;
  profileData: ResumeProfileData;
  content: string;
  createdAt: string;
}
