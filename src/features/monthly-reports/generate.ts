import type { ApplicationWithStudent } from "@/features/applications/types";
import { getMonthlyReportApplicationConfig } from "./application-types";
import type { MonthlyReportDraft, MonthlyReportInput } from "./types";

function normalizeProgressStatus(application: ApplicationWithStudent) {
  const result = String(application.result ?? "").toLowerCase();
  if (/录取|admit|accepted|offer/.test(result)) return "录取";
  if (/拒绝|reject|denied/.test(result)) return "拒绝";
  if (/waitlist|wl|候补/.test(result)) return "waitlist";
  if (/defer|deferred/.test(result)) return "defer";
  if (application.submittedAt || application.applicationStatus === "已提交") return "已提交";
  if (application.applicationStatus === "未提交") return "待申请";
  return "进行中";
}

function inferNextStageFocus(applications: ApplicationWithStudent[]) {
  const upcoming = applications
    .filter(
      (application) =>
        !application.result &&
        !application.submittedAt &&
        application.applicationStatus !== "已提交",
    )
    .map((application) => application.schoolName)
    .slice(0, 3);

  if (upcoming.length === 0) return "继续跟进入读确认、补件、面试或后续材料事项。";
  return `重点推进 ${upcoming.join("、")} 的申请材料与递交准备。`;
}

export function generateMonthlyReportDraft(
  input: MonthlyReportInput,
): MonthlyReportDraft {
  const applicationConfig = getMonthlyReportApplicationConfig(
    input.applicationType ?? input.student.applicationType,
  );

  return {
    id: `monthly-report:${input.student.id}:${input.month}`,
    studentId: input.student.id,
    month: input.month,
    title: `${input.student.name} ${input.student.season} ${applicationConfig.applicationType} ${input.month}申请服务进度反馈`,
    applicationType: applicationConfig.applicationType,
    student: input.student,
    templateName: applicationConfig.templateName,
    theme: applicationConfig.theme,
    timeline: applicationConfig.timeline,
    moduleTitles: applicationConfig.moduleTitles,
    schoolProgress: input.applications.map((application) => ({
      schoolName: application.schoolName,
      round: application.round,
      deadline: application.deadline,
      status: normalizeProgressStatus(application),
      result: application.result,
    })),
    completedThisMonth:
      input.completedThisMonth ?? applicationConfig.defaultContent.completedThisMonth,
    nextMonthPlan: input.nextMonthPlan ?? applicationConfig.defaultContent.nextMonthPlan,
    nextStageFocus:
      input.nextStageFocus ??
      inferNextStageFocus(input.applications) ??
      applicationConfig.defaultContent.nextStageFocus,
    clientTasks: input.clientTasks ?? applicationConfig.defaultContent.clientTasks,
    internalNotes: input.internalNotes,
  };
}
