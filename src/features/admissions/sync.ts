import type { ApplicationWithStudent } from "@/features/applications/types";
import type { AdmissionOutcome, AdmissionResultRecord } from "./types";

function normalizeOutcome(result: string): AdmissionOutcome {
  const value = result.trim().toLowerCase();
  if (/录取|admit|accepted|offer/.test(value)) return "录取";
  if (/拒绝|reject|denied/.test(value)) return "拒绝";
  if (/waitlist|wl|候补/.test(value)) return "waitlist";
  if (/defer|deferred|延迟/.test(value)) return "defer";
  if (/入读|enroll|commit/.test(value)) return "入读";
  if (/放弃|decline/.test(value)) return "放弃";
  return "其他";
}

export function syncAdmissionResultsFromApplications(
  applications: ApplicationWithStudent[],
): AdmissionResultRecord[] {
  return applications
    .filter((application) => !!application.result)
    .map((application) => {
      const rawResult = String(application.result);
      const result = normalizeOutcome(rawResult);
      return {
        id: `admission:${application.id}`,
        applicationId: application.id,
        studentId: application.studentId,
        studentName: application.studentName,
        counselor: application.counselor,
        counselorUserId: application.counselorUserId,
        schoolName: application.schoolName,
        program: application.program,
        major: application.major,
        result,
        rawResult,
        enrollmentStatus: application.enrollmentStatus,
        backgroundSummary: application.student.backgroundSummary,
        posterBackground: application.student.posterBackground,
        canGeneratePoster: result === "录取",
        posterGeneratedAt: null,
        caseGeneratedAt: null,
        student: application.student,
      };
    });
}
