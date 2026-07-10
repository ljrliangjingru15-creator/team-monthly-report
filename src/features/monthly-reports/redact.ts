import type { MonthlyReportDraft } from "./types";

const forbiddenPatterns = [
  /合同金额[:：]?\s*\d+/g,
  /账号[:：]?\S+/g,
  /密码[:：]?\S+/g,
  /电话[:：]?\S+/g,
  /内部责任[:：]?\S+/g,
  /交接处理[:：]?.*/g,
];

function redactText(value: string | null | undefined) {
  if (!value) return value;
  return forbiddenPatterns.reduce(
    (text, pattern) => text.replace(pattern, "[已隐藏]"),
    value,
  );
}

export function buildExternalMonthlyReportPreview(report: MonthlyReportDraft) {
  return {
    ...report,
    student: {
      id: report.student.id,
      season: report.student.season,
      name: report.student.name,
      counselor: report.student.counselor,
      applicationType: report.student.applicationType,
      backgroundSummary: redactText(report.student.backgroundSummary),
    },
    completedThisMonth: redactText(report.completedThisMonth) ?? "",
    nextMonthPlan: redactText(report.nextMonthPlan) ?? "",
    nextStageFocus: redactText(report.nextStageFocus) ?? "",
    clientTasks: report.clientTasks.map((task) => redactText(task) ?? ""),
    internalNotes: undefined,
    previewedAt: report.previewedAt ?? new Date(0),
  };
}

export function containsForbiddenMonthlyReportContent(report: unknown) {
  const text = JSON.stringify(report);
  return /合同金额|账号|密码|学生电话|家长电话|内部责任|交接处理/.test(text);
}
