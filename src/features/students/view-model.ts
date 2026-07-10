import { canViewStudentField } from "@/features/permissions/rules";
import type { Actor } from "@/features/permissions/types";
import type { StudentDetailView, StudentRecord } from "./types";

export function buildStudentDetailView(
  actor: Actor,
  student: StudentRecord,
): StudentDetailView {
  const contractAmountVisible = canViewStudentField(
    actor,
    student,
    "contractAmount",
  );
  const emailVisible = canViewStudentField(actor, student, "email");

  return {
    id: student.id,
    name: student.name,
    season: student.season,
    counselor: student.counselor,
    applicationType: student.applicationType,
    currentStage: student.currentStage,
    handoffStatus: student.handoffStatus,
    contractNumber: student.contractNumber,
    contractType: student.contractType,
    contractAmount: contractAmountVisible ? student.contractAmount : undefined,
    contractAmountVisible,
    email: emailVisible ? student.email : undefined,
    emailVisible,
    backgroundSummary: student.backgroundSummary,
    posterBackground: student.posterBackground,
    specialNotes: student.specialNotes,
    sections: [
      "基础信息",
      "背景摘要",
      "申请项",
      "交接问题",
      "月报历史",
      "录取与案例",
      "修改日志",
    ],
  };
}
