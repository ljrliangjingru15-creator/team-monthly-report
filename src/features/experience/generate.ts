import type { AdmissionResultRecord } from "@/features/admissions/types";
import type { HandoffIssueRecord } from "@/features/handoff/types";
import type { StudentRecord } from "@/features/students/types";
import type { ExperienceCaseRecord, ExperienceCaseType } from "./types";

export function createCaseFromAdmission(
  admission: AdmissionResultRecord,
): ExperienceCaseRecord {
  return {
    id: `case:${admission.id}`,
    type: "STUDENT_SUCCESS",
    title: `${admission.studentName} - ${admission.schoolName} 录取案例`,
    studentId: admission.studentId,
    studentName: admission.studentName,
    schoolName: admission.schoolName,
    season: admission.student.season,
    counselorName: admission.counselor,
    counselorUserId: admission.counselorUserId,
    backgroundSummary: admission.backgroundSummary,
    challenge: "申请过程挑战待顾问补充。",
    handling: "处理方式待顾问补充。",
    outcome: admission.result,
    reusableInsight: "可复用经验待顾问沉淀。",
    internalTags: ["录取", admission.result, admission.schoolName],
    isExternalUsable: false,
    student: admission.student,
    source: admission,
  };
}

export function createExperienceFromHandoffIssue(
  issue: HandoffIssueRecord,
): ExperienceCaseRecord {
  return {
    id: `experience:${issue.id}`,
    type: "HANDOFF_QUALITY",
    title: `${issue.studentName} - ${issue.issueType} 交接经验`,
    studentId: issue.studentId,
    studentName: issue.studentName,
    season: issue.student.season,
    counselorName: issue.counselor,
    counselorUserId: issue.counselorUserId,
    challenge: issue.description,
    handling: issue.resolution ?? "处理方式待补充。",
    outcome: issue.status === "RESOLVED" ? "已解决" : "处理中",
    reusableInsight: "后续交接可复用经验待补充。",
    internalTags: ["交接质量", issue.issueType, issue.priority],
    isExternalUsable: false,
    student: issue.student,
    source: issue,
  };
}

export function createManualExperience(input: {
  type: ExperienceCaseType;
  title: string;
  student?: StudentRecord;
  schoolName?: string;
  season: string;
  counselorName?: string;
  challenge?: string;
  handling?: string;
  outcome?: string;
  reusableInsight?: string;
  internalTags?: string[];
  isExternalUsable?: boolean;
}): ExperienceCaseRecord {
  return {
    id: `manual:${input.title}`,
    type: input.type,
    title: input.title,
    studentId: input.student?.id,
    studentName: input.student?.name,
    schoolName: input.schoolName,
    season: input.season,
    counselorName: input.counselorName ?? input.student?.counselor,
    counselorUserId: input.student?.counselorUserId,
    backgroundSummary: input.student?.backgroundSummary,
    challenge: input.challenge,
    handling: input.handling,
    outcome: input.outcome,
    reusableInsight: input.reusableInsight,
    internalTags: input.internalTags ?? [],
    isExternalUsable: input.isExternalUsable ?? false,
    student: input.student,
    source: input.student,
  };
}
