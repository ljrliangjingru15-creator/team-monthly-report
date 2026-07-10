import type { ApplicationWithStudent } from "@/features/applications/types";
import type { StudentRecord } from "@/features/students/types";
import type {
  MonthlyReportApplicationType,
  MonthlyReportModuleTitles,
  MonthlyReportTheme,
} from "./application-types";

export type MonthlyReportDraft = {
  id: string;
  studentId: string;
  month: string;
  title: string;
  applicationType: MonthlyReportApplicationType;
  student: StudentRecord;
  templateName: string;
  theme: MonthlyReportTheme;
  timeline: string[];
  moduleTitles: MonthlyReportModuleTitles;
  schoolProgress: Array<{
    schoolName: string;
    round?: string | null;
    deadline?: Date | null;
    status: "已提交" | "待申请" | "录取" | "拒绝" | "waitlist" | "defer" | "进行中";
    result?: string | null;
  }>;
  completedThisMonth: string;
  nextMonthPlan: string;
  nextStageFocus: string;
  clientTasks: string[];
  internalNotes?: string;
  previewedAt?: Date;
  exportedAt?: Date;
};

export type MonthlyReportInput = {
  student: StudentRecord;
  applications: ApplicationWithStudent[];
  month: string;
  applicationType?: string | null;
  completedThisMonth?: string;
  nextMonthPlan?: string;
  nextStageFocus?: string;
  clientTasks?: string[];
  internalNotes?: string;
};

export type MonthlyReportExportFormat = "PDF" | "PNG";
