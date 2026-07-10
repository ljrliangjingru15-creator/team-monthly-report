import { canAccessStudent, isLeader } from "@/features/permissions/rules";
import type { Actor } from "@/features/permissions/types";
import type { ExperienceCaseRecord, ExperienceFilters } from "./types";

function includes(value: unknown, search: string) {
  return String(value ?? "").toLowerCase().includes(search.toLowerCase());
}

export function filterExperienceCasesForActor(
  actor: Actor,
  cases: ExperienceCaseRecord[],
  filters: ExperienceFilters = {},
) {
  const search = filters.search?.trim();

  return cases
    .filter((item) => {
      if (item.student) return canAccessStudent(actor, item.student);
      return isLeader(actor) || actor.role === "ADMIN" || item.counselorUserId === actor.id;
    })
    .filter((item) => (filters.type ? item.type === filters.type : true))
    .filter((item) => (filters.season ? item.season === filters.season : true))
    .filter((item) =>
      filters.counselorName ? item.counselorName === filters.counselorName : true,
    )
    .filter((item) => (filters.schoolName ? item.schoolName === filters.schoolName : true))
    .filter((item) =>
      filters.isExternalUsable == null
        ? true
        : item.isExternalUsable === filters.isExternalUsable,
    )
    .filter((item) => {
      if (!search) return true;
      return [
        item.title,
        item.studentName,
        item.schoolName,
        item.challenge,
        item.handling,
        item.reusableInsight,
        item.internalTags.join(" "),
      ].some((value) => includes(value, search));
    });
}

export function summarizeExperienceCases(cases: ExperienceCaseRecord[]) {
  return {
    total: cases.length,
    studentSuccess: cases.filter((item) => item.type === "STUDENT_SUCCESS").length,
    schoolExperience: cases.filter((item) => item.type === "SCHOOL_EXPERIENCE").length,
    riskHandling: cases.filter((item) => item.type === "RISK_HANDLING").length,
    handoffQuality: cases.filter((item) => item.type === "HANDOFF_QUALITY").length,
    externalUsable: cases.filter((item) => item.isExternalUsable).length,
  };
}
