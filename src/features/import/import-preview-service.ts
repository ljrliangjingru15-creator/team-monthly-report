import * as XLSX from "xlsx";
import { detectLayoutDetailed } from "./detect-layout";
import type {
  ImportPreview,
  ParsedApplicationCandidate,
  ParsedStudentCandidate,
  ParseIssue,
  SensitiveHeaderMatch,
  WorkbookLayout,
} from "./types";
import {
  type ExistingApplicationForMatch,
} from "./match-application";
import { type ExistingStudentForMatch } from "./match-student";
import { parseCounselorWorkbook } from "./parse-counselor-workbook";
import { parseMasterSheet } from "./parse-master-sheet";
import { buildImportPreview } from "./preview-import";
import { mapHeaders } from "./map-headers";

type PreviewUploadedWorkbookInput = {
  fileName: string;
  buffer: Buffer | Uint8Array | ArrayBuffer;
  season: string;
  existingStudents: ExistingStudentForMatch[];
  existingApplications: ExistingApplicationForMatch[];
};

export type UploadedWorkbookPreview = {
  fileName: string;
  layout: WorkbookLayout;
  confidence: number;
  reasons: string[];
  parsed: {
    students: number;
    applications: number;
  };
  preview: ImportPreview;
};

function readWorkbook(buffer: PreviewUploadedWorkbookInput["buffer"]) {
  return XLSX.read(buffer, {
    type: buffer instanceof ArrayBuffer ? "array" : "buffer",
    cellDates: true,
  });
}

function sheetRows(workbook: XLSX.WorkBook, sheetName: string) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  }) as unknown[][];
}

function toHeaderInput(value: unknown) {
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

function collectWorkbookSensitiveFields(workbook: XLSX.WorkBook) {
  const sensitiveByKey = new Map<string, SensitiveHeaderMatch>();

  for (const sheetName of workbook.SheetNames) {
    for (const row of sheetRows(workbook, sheetName).slice(0, 5)) {
      const mapping = mapHeaders(row.map(toHeaderInput));
      for (const match of mapping.sensitiveMatches) {
        const key = `${match.category}:${match.normalizedHeader}`;
        sensitiveByKey.set(key, match);
      }
    }
  }

  return Array.from(sensitiveByKey.values()).map((match) => ({
    fieldName: match.header,
    category: match.category,
  }));
}

function emptyUnknownPreview(issues: ParseIssue[]): ImportPreview {
  return buildImportPreview({
    students: [],
    applications: [],
    existingStudents: [],
    existingApplications: [],
    issues,
  });
}

export function previewUploadedWorkbook(
  input: PreviewUploadedWorkbookInput,
): UploadedWorkbookPreview {
  const workbook = readWorkbook(input.buffer);
  const detection = detectLayoutDetailed(workbook);
  const sensitiveFields = collectWorkbookSensitiveFields(workbook);

  let students: ParsedStudentCandidate[] = [];
  let applications: ParsedApplicationCandidate[] = [];
  let issues: ParseIssue[] = [];

  if (detection.layout === "STUDENT_MASTER") {
    const parsed = parseMasterSheet(workbook, {
      season: input.season,
      sheetName: detection.sheetName,
    });
    students = parsed.students;
    issues = parsed.issues;
  } else if (detection.layout === "COUNSELOR_PROGRESS") {
    const parsed = parseCounselorWorkbook(workbook, {
      season: input.season,
    });
    students = parsed.students;
    applications = parsed.applications;
    issues = parsed.issues;
  } else {
    issues = [
      {
        sheetName: workbook.SheetNames[0] ?? input.fileName,
        issueType: "unknown_workbook_layout",
        message: "无法识别该 Excel 的版式，请检查导入配置或人工确认表头行。",
        severity: "error",
      },
    ];
  }

  const preview =
    detection.layout === "UNKNOWN"
      ? emptyUnknownPreview(issues)
      : buildImportPreview({
          students,
          applications,
          issues,
          sensitiveFields,
          existingStudents: input.existingStudents,
          existingApplications: input.existingApplications,
        });

  return {
    fileName: input.fileName,
    layout: detection.layout,
    confidence: detection.confidence,
    reasons: detection.reasons,
    parsed: {
      students: students.length,
      applications: applications.length,
    },
    preview,
  };
}
