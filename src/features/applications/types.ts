import type { StudentRecord } from "@/features/students/types";

export type ApplicationRecord = {
  id: string;
  studentId: string;
  studentName: string;
  counselor?: string | null;
  counselorUserId?: string | null;
  season: string;
  schoolName: string;
  college?: string | null;
  program?: string | null;
  major?: string | null;
  round?: string | null;
  deadline?: Date | null;
  applicationStatus?: string | null;
  materialStatus?: string | null;
  interviewStatus?: string | null;
  submittedAt?: Date | null;
  result?: string | null;
  enrollmentStatus?: string | null;
  finalRiskLevel?: string | null;
};

export type ApplicationWithStudent = ApplicationRecord & {
  student: StudentRecord;
};

export type ApplicationFilters = {
  search?: string;
  season?: string;
  counselor?: string;
  studentName?: string;
  schoolName?: string;
  round?: string;
  applicationStatus?: string;
  result?: string;
  finalRiskLevel?: string;
  deadlineFrom?: Date;
  deadlineTo?: Date;
};

export type ApplicationDetailView = {
  id: string;
  studentName: string;
  schoolName: string;
  major?: string | null;
  round?: string | null;
  deadline?: Date | null;
  applicationStatus?: string | null;
  materialStatus?: string | null;
  interviewStatus?: string | null;
  result?: string | null;
  enrollmentStatus?: string | null;
  finalRiskLevel?: string | null;
  editableFields: string[];
};
