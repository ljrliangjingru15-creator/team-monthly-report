import { canAccessStudent } from "@/features/permissions/rules";
import type { Actor } from "@/features/permissions/types";
import type { ApplicationDetailView, ApplicationWithStudent } from "./types";

export function buildApplicationDetailView(
  actor: Actor,
  application: ApplicationWithStudent,
): ApplicationDetailView {
  if (!canAccessStudent(actor, application.student)) {
    throw new Error("当前账号无权查看该申请项");
  }

  return {
    id: application.id,
    studentName: application.studentName,
    schoolName: application.schoolName,
    major: application.major,
    round: application.round,
    deadline: application.deadline,
    applicationStatus: application.applicationStatus,
    materialStatus: application.materialStatus,
    interviewStatus: application.interviewStatus,
    result: application.result,
    enrollmentStatus: application.enrollmentStatus,
    finalRiskLevel: application.finalRiskLevel,
    editableFields: [
      "schoolName",
      "major",
      "round",
      "deadline",
      "materialStatus",
      "applicationStatus",
      "interviewStatus",
      "result",
      "enrollmentStatus",
    ],
  };
}
