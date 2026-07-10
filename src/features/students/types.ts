export type StudentRecord = {
  id: string;
  season: string;
  name: string;
  counselor?: string | null;
  counselorUserId?: string | null;
  midTermCounselor?: string | null;
  teamName?: string | null;
  applicationType?: string | null;
  currentStage?: string | null;
  handoffStatus?: string | null;
  contractNumber?: string | null;
  contractType?: string | null;
  contractAmount?: number | null;
  contractAmountNotes?: string | null;
  email?: string | null;
  currentSchool?: string | null;
  curriculum?: string | null;
  gpa?: string | null;
  languageScore?: string | null;
  standardizedTest?: string | null;
  backgroundSummary?: string | null;
  posterBackground?: string | null;
  specialNotes?: string | null;
  finalRiskLevel?: string | null;
};

export type StudentFilters = {
  search?: string;
  season?: string;
  counselor?: string;
  applicationType?: string;
  currentStage?: string;
  handoffStatus?: string;
  myStudentsOnly?: boolean;
};

export type StudentDetailView = {
  id: string;
  name: string;
  season: string;
  counselor?: string | null;
  applicationType?: string | null;
  currentStage?: string | null;
  handoffStatus?: string | null;
  contractNumber?: string | null;
  contractType?: string | null;
  contractAmount?: number | null;
  contractAmountVisible: boolean;
  email?: string | null;
  emailVisible: boolean;
  backgroundSummary?: string | null;
  posterBackground?: string | null;
  specialNotes?: string | null;
  sections: string[];
};
