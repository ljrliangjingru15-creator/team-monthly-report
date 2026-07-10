import { describe, expect, it } from "vitest";
import { buildCommitPlan } from "@/features/import/commit-import";
import { buildDashboardMetrics } from "@/features/dashboard/metrics";
import { buildExternalMonthlyReportPreview } from "@/features/monthly-reports/redact";
import { buildExternalPosterPreview } from "@/features/posters/redact";
import { buildImportPreview } from "@/features/import/preview-import";
import { buildMonthlyReportExportPlan } from "@/features/monthly-reports/export-plan";
import { buildPosterExportPlan } from "@/features/posters/export-plan";
import { createCaseFromAdmission } from "@/features/experience/generate";
import { detectFinalizationAnomalies } from "@/features/handoff/finalization";
import { generateMonthlyReportDraft } from "@/features/monthly-reports/generate";
import { generatePosterDraft } from "@/features/posters/generate";
import { parseCounselorWorkbook } from "@/features/import/parse-counselor-workbook";
import { parseMasterSheet } from "@/features/import/parse-master-sheet";
import { scanForSensitiveContent } from "@/features/security/sensitive-scan";
import { syncAdmissionResultsFromApplications } from "@/features/admissions/sync";
import {
  buildCounselorWorkbook,
  buildMasterWorkbook,
  buildUnknownWorkbook,
} from "../fixtures/build-workbooks";
import { detectLayout } from "@/features/import/detect-layout";
import type { ApplicationWithStudent } from "@/features/applications/types";
import type { StudentRecord } from "@/features/students/types";
import type { Actor } from "@/features/permissions/types";

const admin: Actor = { id: "admin", name: "管理员", role: "ADMIN" };

describe("first-batch end-to-end logical workflow", () => {
  it("runs from anonymized workbook import through reports, posters, cases and safety checks", () => {
    const masterWorkbook = buildMasterWorkbook();
    const counselorWorkbook = buildCounselorWorkbook();

    expect(detectLayout(masterWorkbook)).toBe("STUDENT_MASTER");
    expect(detectLayout(counselorWorkbook)).toBe("COUNSELOR_PROGRESS");
    expect(detectLayout(buildUnknownWorkbook())).toBe("UNKNOWN");

    const master = parseMasterSheet(masterWorkbook, { season: "2027 Fall" });
    const counselor = parseCounselorWorkbook(counselorWorkbook, {
      season: "2027 Fall",
    });

    expect(master.students.length).toBeGreaterThan(0);
    expect(counselor.applications.length).toBeGreaterThan(0);
    expect(counselor.applications.some((item) => item.needsReview)).toBe(true);

    const preview = buildImportPreview({
      students: master.students,
      applications: counselor.applications,
      issues: [...master.issues, ...counselor.issues],
      skippedFields: ["学生电话", "密码"],
      sensitiveFields: [
        { fieldName: "学生电话", category: "phone" },
        { fieldName: "密码", category: "password" },
      ],
      existingStudents: [],
      existingApplications: [],
    });

    expect(preview.summary.createdStudents).toBeGreaterThan(0);
    expect(preview.summary.createdApplications).toBeGreaterThan(0);
    expect(preview.summary.sensitiveFields).toBe(2);

    const commitPlan = buildCommitPlan(preview, []);
    expect(commitPlan.status).toBe("ready");

    const student: StudentRecord = {
      ...master.students[0].data,
      id: "student-1",
      counselorUserId: "counselor-1",
    };
    const applications: ApplicationWithStudent[] = counselor.applications
      .filter((item) => item.data.studentName === student.name)
      .map((item, index) => ({
        id: `application-${index + 1}`,
        studentId: student.id,
        studentName: student.name,
        counselor: student.counselor,
        counselorUserId: student.counselorUserId,
        season: student.season,
        schoolName: item.data.schoolName,
        major: item.data.major,
        round: item.data.round,
        deadline: item.data.deadline,
        applicationStatus: item.data.applicationStatus,
        materialStatus: item.data.materialStatus,
        result: index === 0 ? "accepted" : item.data.result,
        student,
      }));

    const metrics = buildDashboardMetrics(
      admin,
      { students: [student], applications, handoffOpenCount: 1 },
      new Date(Date.UTC(2026, 6, 7)),
    );
    expect(metrics.studentCount).toBe(1);
    expect(metrics.applicationCount).toBe(applications.length);

    const anomalies = detectFinalizationAnomalies({
      student,
      expectedSchoolCount: applications.length + 1,
      applications,
    });
    expect(anomalies.map((item) => item.type)).toContain("SCHOOL_COUNT_MISMATCH");

    const admissions = syncAdmissionResultsFromApplications(applications);
    expect(admissions[0]).toMatchObject({
      result: "录取",
      canGeneratePoster: true,
    });

    const report = generateMonthlyReportDraft({
      student,
      applications,
      month: "2026年7月",
      completedThisMonth: "本月完成申请推进。",
      nextMonthPlan: "下月继续跟进。",
      internalNotes: "交接处理: 内部信息",
    });
    const reportPreview = buildExternalMonthlyReportPreview(report);
    expect(scanForSensitiveContent(reportPreview).safe).toBe(true);
    expect(
      buildMonthlyReportExportPlan({ ...report, previewedAt: new Date() }, [
        "PDF",
        "PNG",
      ]).status,
    ).toBe("ready");

    const poster = generatePosterDraft(admissions[0]);
    const posterPreview = buildExternalPosterPreview(poster);
    expect(scanForSensitiveContent(posterPreview).safe).toBe(true);
    expect(
      buildPosterExportPlan({ ...poster, previewedAt: new Date() }, ["PNG", "PDF"])
        .status,
    ).toBe("ready");

    expect(createCaseFromAdmission(admissions[0])).toMatchObject({
      type: "STUDENT_SUCCESS",
      studentName: student.name,
    });
  });
});
