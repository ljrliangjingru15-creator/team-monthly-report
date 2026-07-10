import { filterApplicationsForActor } from "@/features/applications/filters";
import type { Actor } from "@/features/permissions/types";
import { filterStudentsForActor } from "@/features/students/filters";
import { assessDdlRisk } from "@/features/risk/ddl-risk";
import type { DashboardInput, DashboardMetrics } from "./types";

function daysUntil(today: Date, deadline?: Date | null) {
  if (!deadline) return undefined;
  const msPerDay = 24 * 60 * 60 * 1000;
  const startToday = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const startDeadline = Date.UTC(
    deadline.getUTCFullYear(),
    deadline.getUTCMonth(),
    deadline.getUTCDate(),
  );
  return Math.ceil((startDeadline - startToday) / msPerDay);
}

export function buildDashboardMetrics(
  actor: Actor,
  input: DashboardInput,
  today = new Date(),
): DashboardMetrics {
  const students = filterStudentsForActor(actor, input.students);
  const applications = filterApplicationsForActor(actor, input.applications);
  const riskApplications = applications.map((application) => ({
    application,
    risk: assessDdlRisk(application, today),
  }));

  const riskByCounselorMap = new Map<
    string,
    { counselor: string; highRiskCount: number; overdueCount: number }
  >();

  for (const { application, risk } of riskApplications) {
    const counselor = application.counselor ?? "未分配";
    if (!riskByCounselorMap.has(counselor)) {
      riskByCounselorMap.set(counselor, {
        counselor,
        highRiskCount: 0,
        overdueCount: 0,
      });
    }
    const bucket = riskByCounselorMap.get(counselor)!;
    if (risk.level === "HIGH") bucket.highRiskCount += 1;
    if (risk.level === "OVERDUE") bucket.overdueCount += 1;
  }

  return {
    studentCount: students.length,
    applicationCount: applications.length,
    highRiskCount: riskApplications.filter(({ risk }) => risk.level === "HIGH")
      .length,
    overdueCount: riskApplications.filter(({ risk }) => risk.level === "OVERDUE")
      .length,
    nextSevenDaysDdlCount: applications.filter((application) => {
      const days = daysUntil(today, application.deadline);
      return days != null && days >= 0 && days <= 7;
    }).length,
    handoffOpenCount: input.handoffOpenCount ?? 0,
    monthlyReportsDueCount: input.monthlyReportsDueCount ?? 0,
    posterReadyCount: input.posterReadyCount ?? 0,
    caseReadyCount: input.caseReadyCount ?? 0,
    riskByCounselor: Array.from(riskByCounselorMap.values()).sort((a, b) =>
      a.counselor.localeCompare(b.counselor),
    ),
  };
}
