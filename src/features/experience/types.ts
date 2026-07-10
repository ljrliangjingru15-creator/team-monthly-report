import type { AdmissionResultRecord } from "@/features/admissions/types";
import type { HandoffIssueRecord } from "@/features/handoff/types";
import type { StudentRecord } from "@/features/students/types";

export type ExperienceCaseType =
  | "STUDENT_SUCCESS"
  | "SCHOOL_EXPERIENCE"
  | "RISK_HANDLING"
  | "MATERIAL_ESSAY_INTERVIEW"
  | "HANDOFF_QUALITY";

export type ExperienceCaseRecord = {
  id: string;
  type: ExperienceCaseType;
  title: string;
  studentId?: string;
  studentName?: string;
  schoolName?: string;
  season: string;
  counselorName?: string | null;
  counselorUserId?: string | null;
  backgroundSummary?: string | null;
  challenge?: string | null;
  handling?: string | null;
  outcome?: string | null;
  reusableInsight?: string | null;
  internalTags: string[];
  isExternalUsable: boolean;
  student?: StudentRecord;
  source?: AdmissionResultRecord | HandoffIssueRecord | StudentRecord;
};

export type ExperienceFilters = {
  type?: ExperienceCaseType;
  season?: string;
  counselorName?: string;
  schoolName?: string;
  search?: string;
  isExternalUsable?: boolean;
};
