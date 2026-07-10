import { canAccessStudent, canViewStudentField } from "@/features/permissions/rules";
import type { Actor } from "@/features/permissions/types";
import { buildChangeLogData } from "@/features/audit/write-change-log";
import type { StudentRecord } from "./types";

const editableFields = new Set<keyof StudentRecord>([
  "applicationType",
  "currentStage",
  "handoffStatus",
  "currentSchool",
  "curriculum",
  "gpa",
  "languageScore",
  "standardizedTest",
  "backgroundSummary",
  "posterBackground",
  "specialNotes",
  "email",
]);

export function buildStudentManualEditChanges(
  actor: Actor,
  before: StudentRecord,
  after: Partial<StudentRecord>,
) {
  if (!canAccessStudent(actor, before)) {
    throw new Error("当前账号无权编辑该学生");
  }

  const safeAfter = Object.fromEntries(
    Object.entries(after).filter(([fieldName]) => {
      if (!editableFields.has(fieldName as keyof StudentRecord)) return false;
      if (fieldName === "email") {
        return canViewStudentField(actor, before, "email");
      }
      return true;
    }),
  );

  return buildChangeLogData(before, safeAfter);
}
