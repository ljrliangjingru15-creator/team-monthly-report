import {
  canAccessStudent,
  isOwnCounselorStudent,
} from "@/features/permissions/rules";
import type { Actor } from "@/features/permissions/types";
import type { StudentFilters, StudentRecord } from "./types";

function includes(value: unknown, search: string) {
  return String(value ?? "").toLowerCase().includes(search.toLowerCase());
}

export function filterStudentsForActor(
  actor: Actor,
  students: StudentRecord[],
  filters: StudentFilters = {},
) {
  const search = filters.search?.trim();

  return students
    .filter((student) => canAccessStudent(actor, student))
    .filter((student) =>
      filters.myStudentsOnly ? isOwnCounselorStudent(actor, student) : true,
    )
    .filter((student) => (filters.season ? student.season === filters.season : true))
    .filter((student) =>
      filters.counselor ? student.counselor === filters.counselor : true,
    )
    .filter((student) =>
      filters.applicationType
        ? student.applicationType === filters.applicationType
        : true,
    )
    .filter((student) =>
      filters.currentStage ? student.currentStage === filters.currentStage : true,
    )
    .filter((student) =>
      filters.handoffStatus ? student.handoffStatus === filters.handoffStatus : true,
    )
    .filter((student) => {
      if (!search) return true;
      return [
        student.name,
        student.counselor,
        student.contractNumber,
        student.currentSchool,
        student.backgroundSummary,
      ].some((value) => includes(value, search));
    });
}
