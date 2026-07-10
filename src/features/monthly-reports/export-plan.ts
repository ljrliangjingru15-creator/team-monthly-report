import type { MonthlyReportDraft, MonthlyReportExportFormat } from "./types";

type MonthlyReportExportPlanOptions = {
  generatedAt?: Date;
};

function formatDateForFileName(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function sanitizeFileNameSegment(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildMonthlyReportExportPlan(
  report: MonthlyReportDraft,
  formats: MonthlyReportExportFormat[],
  options: MonthlyReportExportPlanOptions = {},
) {
  if (!report.previewedAt) {
    return {
      status: "blocked" as const,
      reason: "preview_required" as const,
      operations: [],
    };
  }

  const generatedDate = formatDateForFileName(options.generatedAt ?? new Date());
  const separator = "_";
  const baseFileName = [
    report.student.name,
    report.applicationType,
    report.student.season,
    "反馈报告",
    generatedDate,
  ]
    .map(sanitizeFileNameSegment)
    .filter(Boolean)
    .join(separator);

  return {
    status: "ready" as const,
    operations: formats.map((format) => ({
      type: "export_monthly_report" as const,
      reportId: report.id,
      format,
      fileName: `${baseFileName}.${format.toLowerCase()}`,
    })),
  };
}
