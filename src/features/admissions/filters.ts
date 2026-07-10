import { canAccessStudent } from "@/features/permissions/rules";
import type { Actor } from "@/features/permissions/types";
import type { AdmissionFilters, AdmissionResultRecord } from "./types";

function includes(value: unknown, search: string) {
  return String(value ?? "").toLowerCase().includes(search.toLowerCase());
}

export function filterAdmissionResultsForActor(
  actor: Actor,
  results: AdmissionResultRecord[],
  filters: AdmissionFilters = {},
) {
  return results
    .filter((result) => canAccessStudent(actor, result.student))
    .filter((result) => (filters.counselor ? result.counselor === filters.counselor : true))
    .filter((result) =>
      filters.studentName ? result.studentName === filters.studentName : true,
    )
    .filter((result) =>
      filters.schoolName ? includes(result.schoolName, filters.schoolName) : true,
    )
    .filter((result) => (filters.result ? result.result === filters.result : true))
    .filter((result) =>
      filters.canGeneratePoster == null
        ? true
        : result.canGeneratePoster === filters.canGeneratePoster,
    )
    .filter((result) =>
      filters.posterGenerated == null
        ? true
        : Boolean(result.posterGeneratedAt) === filters.posterGenerated,
    )
    .filter((result) =>
      filters.caseGenerated == null
        ? true
        : Boolean(result.caseGeneratedAt) === filters.caseGenerated,
    );
}

export function summarizeAdmissionResults(results: AdmissionResultRecord[]) {
  return {
    total: results.length,
    admitted: results.filter((result) => result.result === "录取").length,
    rejected: results.filter((result) => result.result === "拒绝").length,
    waitlist: results.filter((result) => result.result === "waitlist").length,
    defer: results.filter((result) => result.result === "defer").length,
    posterReady: results.filter(
      (result) => result.canGeneratePoster && !result.posterGeneratedAt,
    ).length,
    caseReady: results.filter((result) => !result.caseGeneratedAt).length,
  };
}
