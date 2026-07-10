import { canAccessStudent } from "@/features/permissions/rules";
import type { Actor } from "@/features/permissions/types";
import type { ApplicationFilters, ApplicationWithStudent } from "./types";

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

export function filterApplicationsForActor(
  actor: Actor,
  applications: ApplicationWithStudent[],
  filters: ApplicationFilters = {},
) {
  const search = filters.search?.trim();

  return applications
    .filter((application) => canAccessStudent(actor, application.student))
    .filter((application) =>
      filters.season ? application.season === filters.season : true,
    )
    .filter((application) =>
      filters.counselor ? application.counselor === filters.counselor : true,
    )
    .filter((application) =>
      filters.studentName ? application.studentName === filters.studentName : true,
    )
    .filter((application) =>
      filters.schoolName ? application.schoolName === filters.schoolName : true,
    )
    .filter((application) =>
      filters.round ? application.round === filters.round : true,
    )
    .filter((application) =>
      filters.applicationStatus
        ? application.applicationStatus === filters.applicationStatus
        : true,
    )
    .filter((application) =>
      filters.result ? application.result === filters.result : true,
    )
    .filter((application) =>
      filters.finalRiskLevel
        ? application.finalRiskLevel === filters.finalRiskLevel
        : true,
    )
    .filter((application) =>
      withinDeadline(application.deadline, filters.deadlineFrom, filters.deadlineTo),
    )
    .filter((application) => {
      if (!search) return true;
      return [
        application.studentName,
        application.schoolName,
        application.major,
        application.round,
        application.applicationStatus,
        application.result,
      ].some((value) => includes(value, search));
    });
}
