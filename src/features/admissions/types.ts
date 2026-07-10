import type { ApplicationWithStudent } from "@/features/applications/types";

export type AdmissionOutcome =
  | "录取"
  | "拒绝"
  | "waitlist"
  | "defer"
  | "入读"
  | "放弃"
  | "其他";

export type AdmissionResultRecord = {
  id: string;
  applicationId: string;
  studentId: string;
  studentName: string;
  counselor?: string | null;
  counselorUserId?: string | null;
  schoolName: string;
  program?: string | null;
  major?: string | null;
  result: AdmissionOutcome;
  rawResult: string;
  enrollmentStatus?: string | null;
  backgroundSummary?: string | null;
  posterBackground?: string | null;
  canGeneratePoster: boolean;
  posterGeneratedAt?: Date | null;
  caseGeneratedAt?: Date | null;
  student: ApplicationWithStudent["student"];
};

export type AdmissionFilters = {
  counselor?: string;
  studentName?: string;
  schoolName?: string;
  result?: AdmissionOutcome;
  canGeneratePoster?: boolean;
  posterGenerated?: boolean;
  caseGenerated?: boolean;
};
