import type { ApplicationWithStudent } from "@/features/applications/types";
import type { StudentRecord } from "@/features/students/types";

export type DashboardInput = {
  students: StudentRecord[];
  applications: ApplicationWithStudent[];
  handoffOpenCount?: number;
  monthlyReportsDueCount?: number;
  posterReadyCount?: number;
  caseReadyCount?: number;
};

export type DashboardMetrics = {
  studentCount: number;
  applicationCount: number;
  highRiskCount: number;
  overdueCount: number;
  nextSevenDaysDdlCount: number;
  handoffOpenCount: number;
  monthlyReportsDueCount: number;
  posterReadyCount: number;
  caseReadyCount: number;
  riskByCounselor: Array<{
    counselor: string;
    highRiskCount: number;
    overdueCount: number;
  }>;
};
