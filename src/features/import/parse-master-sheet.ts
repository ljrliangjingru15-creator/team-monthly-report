import * as XLSX from "xlsx";
import { studentMasterDefaultConfig } from "@/features/import-config/defaults";
import { mapHeaders } from "./map-headers";
import {
  normalizeNumber,
  normalizeStatus,
  normalizeText,
} from "./normalize-value";
import type { HeaderInput, ParsedStudentCandidate, ParseIssue } from "./types";

type ParseMasterOptions = {
  season: string;
  sheetName?: string;
};

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

function hasAnyValue(row: unknown[]) {
  return row.some((cell) => normalizeText(cell));
}

export function parseMasterSheet(
  workbook: XLSX.WorkBook,
  options: ParseMasterOptions,
) {
  const sheetName =
    options.sheetName ??
    (studentMasterDefaultConfig.sheetRules.mode === "fixed"
      ? studentMasterDefaultConfig.sheetRules.sheetName
      : workbook.SheetNames[0]);
  const rows = rowsFromSheet(workbook, sheetName);
  const issues: ParseIssue[] = [];

  if (rows.length === 0) {
    return {
      students: [] as ParsedStudentCandidate[],
      issues: [
        {
          sheetName,
          issueType: "sheet_not_found_or_empty",
          message: `未找到或无法读取 Sheet：${sheetName}`,
          severity: "error" as const,
        },
      ],
    };
  }

  const headerIndex = studentMasterDefaultConfig.headerRules.headerRow - 1;
  const headers = rows[headerIndex] ?? [];
  const mapping = mapHeaders(headers.map(toHeaderInput));

  if (mapping.fields.name == null) {
    issues.push({
      sheetName,
      rowNumber: headerIndex + 1,
      issueType: "missing_required_header",
      message: "总表缺少学生姓名表头",
      severity: "error",
    });
  }

  const students = rows
    .slice(headerIndex + 1)
    .map((row, offset): ParsedStudentCandidate | null => {
      const rowNumber = headerIndex + 2 + offset;
      if (!hasAnyValue(row)) return null;

      const name = normalizeText(value(row, mapping.fields.name));
      if (!name) {
        issues.push({
          sheetName,
          rowNumber,
          issueType: "missing_student_name",
          message: "该行缺少学生姓名，已跳过",
          severity: "warning",
        });
        return null;
      }

      return {
        source: { sheetName, rowNumber },
        data: {
          season: options.season,
          name,
          counselor: normalizeText(value(row, mapping.fields.counselor)),
          midTermCounselor: normalizeText(value(row, mapping.fields.midTermCounselor)),
          salesCounselor: normalizeText(value(row, mapping.fields.salesCounselor)),
          contractNumber: normalizeText(value(row, mapping.fields.contractNumber)),
          contractType: normalizeText(value(row, mapping.fields.contractType)),
          contractAmount: normalizeNumber(value(row, mapping.fields.contractAmount)),
          contractAmountNotes: normalizeText(
            value(row, mapping.fields.contractAmountNotes),
          ),
          applicationType: normalizeText(value(row, mapping.fields.applicationType)),
          currentSchool: normalizeText(value(row, mapping.fields.currentSchool)),
          highSchoolType: normalizeText(value(row, mapping.fields.highSchoolType)),
          curriculum: normalizeText(value(row, mapping.fields.curriculum)),
          applicationIdentity: normalizeText(
            value(row, mapping.fields.applicationIdentity),
          ),
          visaStatus: normalizeStatus(value(row, mapping.fields.visaStatus)),
          gpa: normalizeText(value(row, mapping.fields.gpa)),
          languageScore: normalizeText(value(row, mapping.fields.languageScore)),
          standardizedTest: normalizeText(
            value(row, mapping.fields.standardizedTest),
          ),
          apIbALevel: normalizeText(value(row, mapping.fields.apIbALevel)),
          backgroundSummary: normalizeText(
            value(row, mapping.fields.backgroundSummary),
          ),
          posterBackground: normalizeText(value(row, mapping.fields.posterBackground)),
          specialNotes: normalizeText(value(row, mapping.fields.specialNotes)),
        },
      };
    })
    .filter((student): student is ParsedStudentCandidate => student != null);

  return { students, issues, mapping };
}
