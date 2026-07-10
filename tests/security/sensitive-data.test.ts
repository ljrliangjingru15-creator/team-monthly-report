import { describe, expect, it } from "vitest";
import { buildStudentDetailView } from "@/features/students/view-model";
import { generateMonthlyReportDraft } from "@/features/monthly-reports/generate";
import { buildExternalMonthlyReportPreview } from "@/features/monthly-reports/redact";
import { generatePosterDraft } from "@/features/posters/generate";
import { buildExternalPosterPreview } from "@/features/posters/redact";
import { assertNoSensitiveContent, scanForSensitiveContent } from "@/features/security/sensitive-scan";
import type { AdmissionResultRecord } from "@/features/admissions/types";
import type { ApplicationWithStudent } from "@/features/applications/types";
import type { Actor } from "@/features/permissions/types";
import type { StudentRecord } from "@/features/students/types";

const counselor: Actor = { id: "counselor-1", name: "顾问甲", role: "COUNSELOR" };
const student: StudentRecord = {
  id: "student-1",
  season: "2027 Fall",
  name: "测试学生甲",
  counselor: "顾问甲",
  counselorUserId: "counselor-1",
  contractAmount: 100000,
  email: "student@example.com",
  backgroundSummary: "背景摘要；合同金额:100000；账号: hidden；密码: hidden",
};
const applications: ApplicationWithStudent[] = [
  {
    id: "application-1",
    studentId: "student-1",
    studentName: "测试学生甲",
    counselor: "顾问甲",
    season: "2027 Fall",
    schoolName: "Offer University",
    result: "accepted",
    student,
  },
];
const admission: AdmissionResultRecord = {
  id: "admission-1",
  applicationId: "application-1",
  studentId: "student-1",
  studentName: "测试学生甲",
  counselor: "顾问甲",
  schoolName: "Offer University",
  result: "录取",
  rawResult: "accepted",
  posterBackground: "喜报背景；电话: 123；内部交接: hidden",
  canGeneratePoster: true,
  student,
};

describe("sensitive data regression", () => {
  it("detects sensitive text in arbitrary payloads", () => {
    expect(scanForSensitiveContent({ note: "密码: secret" }).safe).toBe(false);
    expect(() => assertNoSensitiveContent({ note: "正常内容" })).not.toThrow();
  });

  it("does not show contract amount in counselor student views", () => {
    const view = buildStudentDetailView(counselor, student);
    expect(view.contractAmount).toBeUndefined();
  });

  it("keeps external monthly reports free of sensitive content", () => {
    const report = generateMonthlyReportDraft({
      student,
      applications,
      month: "2026年7月",
      completedThisMonth: "完成事项；家长电话: 123",
      internalNotes: "交接处理: 内部",
    });
    const preview = buildExternalMonthlyReportPreview(report);

    expect(() => assertNoSensitiveContent(preview)).not.toThrow();
  });

  it("keeps external posters free of sensitive content", () => {
    const poster = buildExternalPosterPreview(generatePosterDraft(admission));

    expect(() => assertNoSensitiveContent(poster)).not.toThrow();
  });
});
