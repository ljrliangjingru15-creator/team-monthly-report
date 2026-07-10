import { filterApplicationsForActor } from "@/features/applications/filters";
import type { ApplicationWithStudent } from "@/features/applications/types";
import type { Actor } from "@/features/permissions/types";
import { assessDdlRisk } from "./ddl-risk";
import type { RiskApplication, RiskFilters } from "./types";

function includes(value: unknown, search: string) {
  return String(value ?? "").toLowerCase().includes(search.toLowerCase());
}

function withinDeadline(
  deadline: Date | null | undefined,
  from?: Date,
  to?: Date,
) {
  if (!from && !to) return true;
  if (!deadline) return false;
  if (from && deadline < from) return false;
  if (to && deadline > to) return false;
  return true;
}

export function buildRiskApplications(
  actor: Actor,
  applications: ApplicationWithStudent[],
  filters: RiskFilters = {},
  today = new Date(),
): RiskApplication[] {
  return filterApplicationsForActor(actor, applications)
    .map((application) => ({
      ...application,
      risk: assessDdlRisk(application, today),
    }))
    .filter((application) =>
      filters.counselor ? application.counselor === filters.counselor : true,
    )
    .filter((application) =>
      filters.studentName ? application.studentName === filters.studentName : true,
    )
    .filter((application) =>
      filters.schoolName ? includes(application.schoolName, filters.schoolName) : true,
    )
    .filter((application) =>
      filters.level ? application.risk.level === filters.level : true,
    )
    .filter((application) =>
      filters.applicationStatus
        ? application.applicationStatus === filters.applicationStatus
        : true,
    )
    .filter((application) =>
      withinDeadline(application.deadline, filters.deadlineFrom, filters.deadlineTo),
    );
}
