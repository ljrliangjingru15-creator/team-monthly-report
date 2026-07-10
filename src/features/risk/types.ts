import type { ApplicationWithStudent } from "@/features/applications/types";

export type DdlRiskLevel = "NORMAL" | "WATCH" | "HIGH" | "OVERDUE";

export type RiskAssessment = {
  level: DdlRiskLevel;
  reason: string;
  daysUntilDeadline?: number;
};

export type RiskApplication = ApplicationWithStudent & {
  risk: RiskAssessment;
};

export type RiskFilters = {
  counselor?: string;
  studentName?: string;
  schoolName?: string;
  level?: DdlRiskLevel;
  applicationStatus?: string;
  deadlineFrom?: Date;
  deadlineTo?: Date;
};
