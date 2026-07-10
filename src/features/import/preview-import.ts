import {
  matchApplication,
  type ExistingApplicationForMatch,
} from "./match-application";
import { matchStudent, type ExistingStudentForMatch } from "./match-student";
import { diffRecords } from "./diff-records";
import type {
  ImportPreview,
  ParsedApplicationCandidate,
  ParsedStudentCandidate,
  ParseIssue,
} from "./types";

type PreviewInput = {
  students: ParsedStudentCandidate[];
  applications: ParsedApplicationCandidate[];
  issues?: ParseIssue[];
  skippedFields?: string[];
  sensitiveFields?: ImportPreview["sensitiveFields"];
  existingStudents: ExistingStudentForMatch[];
  existingApplications: ExistingApplicationForMatch[];
};

const studentProtectedFields = ["counselor", "contractAmount"];
const applicationProtectedFields = ["deadline", "applicationStatus", "result"];

export function buildImportPreview(input: PreviewInput): ImportPreview {
  const preview: ImportPreview = {
    createdStudents: [],
    updatedStudents: [],
    createdApplications: [],
    updatedApplications: [],
    conflicts: [],
    skippedFields: input.skippedFields ?? [],
    sensitiveFields: input.sensitiveFields ?? [],
    manualReview: [...(input.issues ?? [])],
    summary: {
      createdStudents: 0,
      updatedStudents: 0,
      createdApplications: 0,
      updatedApplications: 0,
      conflicts: 0,
      manualReview: 0,
      skippedFields: 0,
      sensitiveFields: 0,
    },
  };

  const studentIdByName = new Map<string, string>();
  const newStudentRefByName = new Map<string, string>();
  const ambiguousStudentNames = new Set<string>();

  for (const student of input.students) {
    const match = matchStudent(student.data, input.existingStudents);

    if (match.status === "new") {
      newStudentRefByName.set(student.data.name, `new:${student.data.name}`);
      preview.createdStudents.push({
        entityType: "student",
        incoming: student.data,
        changes: Object.entries(student.data)
          .filter(([, value]) => value != null && value !== "")
          .map(([fieldName, value]) => ({
            fieldName,
            oldValue: undefined,
            newValue: value,
          })),
        conflicts: [],
      });
      continue;
    }

    if (match.status === "ambiguous") {
      ambiguousStudentNames.add(student.data.name);
      preview.manualReview.push({
        sheetName: student.source.sheetName,
        rowNumber: student.source.rowNumber,
        issueType: "ambiguous_student_match",
        message: `学生 ${student.data.name} 匹配到多个候选，需人工确认`,
        severity: "warning",
      });
      continue;
    }

    studentIdByName.set(student.data.name, match.record.id);
    const diff = diffRecords(match.record as unknown as Record<string, unknown>, student.data, {
      entityType: "student",
      entityId: match.record.id,
      source: student.source,
      protectedFields: studentProtectedFields,
    });

    if (diff.changes.length > 0) {
      const item = {
        entityType: "student" as const,
        incoming: student.data,
        existing: match.record,
        changes: diff.changes,
        conflicts: diff.conflicts,
      };
      preview.updatedStudents.push(item);
      preview.conflicts.push(...diff.conflicts);
    }
  }

  for (const application of input.applications) {
    if (application.needsReview) {
      preview.manualReview.push({
        sheetName: application.source.sheetName,
        rowNumber: application.source.rowNumber,
        issueType: "application_needs_review",
        message: application.reviewReason ?? "申请项需人工确认",
        severity: "warning",
      });
    }

    const matchedStudentId =
      studentIdByName.get(application.data.studentName) ??
      input.existingStudents.find((student) => student.name === application.data.studentName)
        ?.id ??
      newStudentRefByName.get(application.data.studentName);

    if (ambiguousStudentNames.has(application.data.studentName)) {
      preview.manualReview.push({
        sheetName: application.source.sheetName,
        rowNumber: application.source.rowNumber,
        issueType: "application_student_match_ambiguous",
        message: `申请项 ${application.data.schoolName} 所属学生匹配未确认，需人工处理`,
        severity: "warning",
      });
      continue;
    }

    const match = matchApplication(
      { ...application.data, studentId: matchedStudentId },
      input.existingApplications,
    );

    if (match.status === "manual_review") {
      preview.manualReview.push({
        sheetName: application.source.sheetName,
        rowNumber: application.source.rowNumber,
        issueType: "application_missing_match_fields",
        message: `申请项缺少匹配字段：${match.missingFields.join(", ")}`,
        severity: "warning",
      });
      continue;
    }

    if (match.status === "new") {
      preview.createdApplications.push({
        entityType: "application",
        incoming: application.data,
        changes: Object.entries(application.data)
          .filter(([, value]) => value != null && value !== "")
          .map(([fieldName, value]) => ({
            fieldName,
            oldValue: undefined,
            newValue: value,
          })),
        conflicts: [],
      });
      continue;
    }

    if (match.status === "ambiguous") {
      preview.manualReview.push({
        sheetName: application.source.sheetName,
        rowNumber: application.source.rowNumber,
        issueType: "ambiguous_application_match",
        message: `申请项 ${application.data.schoolName} 匹配到多个候选，需人工确认`,
        severity: "warning",
      });
      continue;
    }

    const diff = diffRecords(
      match.record as unknown as Record<string, unknown>,
      application.data,
      {
        entityType: "application",
        entityId: match.record.id,
        source: application.source,
        protectedFields: applicationProtectedFields,
      },
    );

    if (diff.changes.length > 0) {
      const item = {
        entityType: "application" as const,
        incoming: application.data,
        existing: match.record,
        changes: diff.changes,
        conflicts: diff.conflicts,
      };
      preview.updatedApplications.push(item);
      preview.conflicts.push(...diff.conflicts);
    }
  }

  preview.summary = {
    createdStudents: preview.createdStudents.length,
    updatedStudents: preview.updatedStudents.length,
    createdApplications: preview.createdApplications.length,
    updatedApplications: preview.updatedApplications.length,
    conflicts: preview.conflicts.length,
    manualReview: preview.manualReview.length,
    skippedFields: preview.skippedFields.length,
    sensitiveFields: preview.sensitiveFields.length,
  };

  return preview;
}
