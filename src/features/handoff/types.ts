import type { ApplicationWithStudent } from "@/features/applications/types";
import type { StudentRecord } from "@/features/students/types";

export type SchoolFinalizationStatus =
  | "UNCONFIRMED"
  | "CONFIRMED"
  | "QUESTIONED"
  | "NEEDS_INFO"
  | "NOT_APPLICABLE";

export type HandoffIssueType =
  | "SCHOOL_COUNT_MISMATCH"
  | "MISSING_APPLICATION_SCHOOL"
  | "EXTRA_APPLICATION_SCHOOL"
  | "MISSING_DDL"
  | "UNCLEAR_APPLICATION_STATUS"
  | "CONTRACT_SCOPE_QUESTION"
  | "MISSING_BACKGROUND"
  | "SPECIAL_SHEET_REVIEW"
  | "OTHER";

export type HandoffIssueStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "WAITING"
  | "RESOLVED"
  | "DEFERRED";

export type HandoffIssuePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type SchoolFinalizationInput = {
  student: StudentRecord;
  expectedSchoolCount?: number;
  contractSchoolCount?: number;
  systemSchoolCount?: number;
  confirmedSchoolNames?: string[];
  applications: ApplicationWithStudent[];
  isSpecialStructure?: boolean;
};

export type FinalizationAnomaly = {
  type: HandoffIssueType;
  message: string;
  priority: HandoffIssuePriority;
  schoolName?: string;
};

export type HandoffIssueRecord = {
  id: string;
  studentId: string;
  studentName: string;
  counselor?: string | null;
  counselorUserId?: string | null;
  midTermCounselor?: string | null;
  issueType: HandoffIssueType;
  description: string;
  ownerUserId?: string | null;
  ownerName?: string | null;
  priority: HandoffIssuePriority;
  status: HandoffIssueStatus;
  resolution?: string | null;
  internalNotes?: string | null;
  createdAt: Date;
  resolvedAt?: Date | null;
  student: StudentRecord;
};

export type HandoffIssueFilters = {
  counselor?: string;
  midTermCounselor?: string;
  status?: HandoffIssueStatus;
  priority?: HandoffIssuePriority;
  issueType?: HandoffIssueType;
  ownerName?: string;
};

export type HandoffIssueDraft = {
  student: StudentRecord;
  issueType: HandoffIssueType;
  description: string;
  ownerUserId?: string;
  ownerName?: string;
  priority?: HandoffIssuePriority;
};
