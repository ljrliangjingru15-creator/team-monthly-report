import * as XLSX from "xlsx";
import { counselorProgressDefaultConfig } from "@/features/import-config/defaults";
import { mapHeaders } from "./map-headers";
import {
  normalizeDate,
  normalizeResult,
  normalizeRound,
  normalizeSchoolName,
  normalizeStatus,
  normalizeText,
} from "./normalize-value";
import type {
  HeaderInput,
  ParsedAdmissionResultCandidate,
  ParsedApplicationCandidate,
  ParsedStudentCandidate,
  ParseIssue,
} from "./types";

function rowsFromSheet(workbook: XLSX.WorkBook, sheetName: string) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  }) as unknown[][];
}

function value(row: unknown[], index: number | undefined) {
  if (index == null) return undefined;
  return row[index];
}

function toHeaderInput(value: unknown): HeaderInput {
  if (
    value == null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return String(value);
}

function inferStudentName(sheetName: string) {
  return sheetName
    .replace(/^\s*\d+\s*[.、-]\s*/, "")
    .replace(/[（(].*?[）)]/g, "")
    .trim();
}

function hasAnyValue(row: unknown[]) {
  return row.some((cell) => normalizeText(cell));
}

export function parseCounselorWorkbook(
  workbook: XLSX.WorkBook,
  options: { season: string },
) {
  const studentsByName = new Map<string, ParsedStudentCandidate>();
  const applications: ParsedApplicationCandidate[] = [];
  const admissionResults: ParsedAdmissionResultCandidate[] = [];
  const issues: ParseIssue[] = [];

  for (const sheetName of workbook.SheetNames) {
    const rows = rowsFromSheet(workbook, sheetName);
    if (rows.length === 0) continue;

    const headerIndex = counselorProgressDefaultConfig.headerRules.headerRow - 1;
    const headers = rows[headerIndex] ?? [];
    const mapping = mapHeaders(headers.map(toHeaderInput));
    const inferredStudentName = inferStudentName(sheetName);
    const sheetHasNameColumn = mapping.fields.name != null;
    const sheetHasSchoolColumn = mapping.fields.schoolName != null;

    if (!sheetHasSchoolColumn) {
      issues.push({
        sheetName,
        issueType: "missing_school_header",
        message: "该 Sheet 缺少申请学校表头，需人工确认",
        severity: "warning",
      });
      continue;
    }

    for (const [offset, row] of rows.slice(headerIndex + 1).entries()) {
      const rowNumber = headerIndex + 2 + offset;
      if (!hasAnyValue(row)) continue;

      const rawName = normalizeText(value(row, mapping.fields.name));
      const studentName = rawName ?? inferredStudentName;
      const schoolName = normalizeSchoolName(value(row, mapping.fields.schoolName));

      if (!studentName || !schoolName) {
        issues.push({
          sheetName,
          rowNumber,
          issueType: "missing_student_or_school",
          message: "该行缺少学生姓名或申请学校，需人工确认",
          severity: "warning",
        });
        continue;
      }

      const needsReview = !sheetHasNameColumn || !rawName || /特殊|合办|单文书/.test(sheetName);
      const studentEmail = normalizeText(value(row, mapping.fields.email));

      if (!studentsByName.has(studentName)) {
        studentsByName.set(studentName, {
          source: { sheetName, rowNumber },
          data: {
            season: options.season,
            name: studentName,
            email: studentEmail,
          },
        });
      }

      const application: ParsedApplicationCandidate = {
        source: { sheetName, rowNumber },
        needsReview,
        reviewReason: needsReview
          ? "该 Sheet 可能是特殊结构或学生姓名由 Sheet 名推断"
          : undefined,
        data: {
          studentName,
          studentEmail,
          schoolName,
          applicationMethod: normalizeText(
            value(row, mapping.fields.applicationMethod),
          ),
          college: normalizeText(value(row, mapping.fields.college)),
          major: normalizeText(value(row, mapping.fields.major)),
          round: normalizeRound(value(row, mapping.fields.round)),
          deadline: normalizeDate(value(row, mapping.fields.deadline)),
          interviewStatus: normalizeStatus(
            value(row, mapping.fields.interviewStatus),
          ),
          materialStatus: normalizeStatus(value(row, mapping.fields.materialStatus)),
          submittedAt: normalizeDate(value(row, mapping.fields.submittedAt)),
          applicationStatus: normalizeStatus(
            value(row, mapping.fields.applicationStatus),
          ),
          result: normalizeResult(value(row, mapping.fields.result)),
          enrollmentStatus: normalizeStatus(
            value(row, mapping.fields.enrollmentStatus),
          ),
        },
      };
      applications.push(application);

      if (application.data.result) {
        admissionResults.push({
          source: { sheetName, rowNumber },
          data: {
            studentName,
            schoolName,
            major: application.data.major,
            result: application.data.result,
            enrollmentStatus: application.data.enrollmentStatus,
          },
        });
      }
    }
  }

  return {
    students: Array.from(studentsByName.values()),
    applications,
    admissionResults,
    issues,
  };
}
