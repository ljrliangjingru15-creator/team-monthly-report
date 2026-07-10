import type { ApplicationWithStudent } from "@/features/applications/types";
import type { RiskAssessment } from "./types";

const submittedStatuses = new Set(["已提交", "已完成", "submitted", "complete"]);

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetween(from: Date, to: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / msPerDay);
}

function isSubmitted(application: ApplicationWithStudent) {
  const status = String(application.applicationStatus ?? "").trim().toLowerCase();
  return !!application.submittedAt || submittedStatuses.has(status);
}

function hasPendingPostSubmitWork(application: ApplicationWithStudent) {
  return [application.materialStatus, application.interviewStatus]
    .map((value) => String(value ?? "").trim())
    .some((value) => value && !/已完成|完成|无需|n\/a|na/i.test(value));
}

export function assessDdlRisk(
  application: ApplicationWithStudent,
  today = new Date(),
): RiskAssessment {
  if (!application.deadline) {
    return { level: "NORMAL", reason: "未提供 DDL，暂不按日期预警" };
  }

  const submitted = isSubmitted(application);
  if (submitted && !hasPendingPostSubmitWork(application)) {
    return { level: "NORMAL", reason: "申请已提交，且无待处理后续事项" };
  }

  const daysUntilDeadline = daysBetween(today, application.deadline);

  if (daysUntilDeadline < 0) {
    return {
      level: submitted ? "WATCH" : "OVERDUE",
      reason: submitted
        ? "申请已提交，但仍有后续事项需关注"
        : "DDL 已过且申请未提交/未完成",
      daysUntilDeadline,
    };
  }

  if (daysUntilDeadline <= 7) {
    return {
      level: "HIGH",
      reason: "距离 DDL 1–7 天",
      daysUntilDeadline,
    };
  }

  if (daysUntilDeadline <= 14) {
    return {
      level: "WATCH",
      reason: "距离 DDL 8–14 天",
      daysUntilDeadline,
    };
  }

  return {
    level: "NORMAL",
    reason: "距离 DDL 15 天以上",
    daysUntilDeadline,
  };
}
