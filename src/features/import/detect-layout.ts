import type { WorkBook } from "xlsx";
import * as XLSX from "xlsx";
import { mapHeaders } from "./map-headers";
import { normalizeHeader } from "./normalize-header";
import type { HeaderInput, LayoutDetectionResult, WorkbookLayout } from "./types";

function sheetRows(workbook: WorkBook, sheetName: string) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];

  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
    defval: "",
  }) as unknown[][];
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

function rowScore(headers: unknown[], expectedFields: string[]) {
  const mapping = mapHeaders(headers.map(toHeaderInput));
  return expectedFields.filter((field) => mapping.fields[field] != null).length;
}

function detectMaster(workbook: WorkBook): LayoutDetectionResult {
  const candidateSheetNames = workbook.SheetNames.filter((name) =>
    /申请/.test(normalizeHeader(name)),
  );
  const sheetNames = candidateSheetNames.length > 0 ? candidateSheetNames : workbook.SheetNames;
  let best: LayoutDetectionResult = {
    layout: "UNKNOWN",
    confidence: 0,
    reasons: [],
  };

  for (const sheetName of sheetNames) {
    const rows = sheetRows(workbook, sheetName).slice(0, 8);
    rows.forEach((row, rowIndex) => {
      const score = rowScore(row, [
        "name",
        "counselor",
        "contractNumber",
        "applicationType",
        "backgroundSummary",
      ]);
      const sheetNameBonus = normalizeHeader(sheetName).includes("申请") ? 1 : 0;
      const confidence = Math.min(1, (score + sheetNameBonus) / 6);

      if (confidence > best.confidence) {
        best = {
          layout: confidence >= 0.5 ? "STUDENT_MASTER" : "UNKNOWN",
          confidence,
          sheetName,
          reasons: [`第 ${rowIndex + 1} 行匹配 ${score} 个总表关键字段`],
        };
      }
    });
  }

  return best;
}

function detectCounselorProgress(workbook: WorkBook): LayoutDetectionResult {
  let matchedSheets = 0;
  const reasons: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const rows = sheetRows(workbook, sheetName).slice(0, 4);
    const sheetLooksLikeStudent = /^\s*\d+[.、]/.test(sheetName) || /学生|同学/.test(sheetName);

    const bestScore = Math.max(
      0,
      ...rows.map((row) =>
        rowScore(row, [
          "name",
          "schoolName",
          "deadline",
          "applicationStatus",
          "result",
        ]),
      ),
    );

    if (bestScore >= 2 || sheetLooksLikeStudent) {
      matchedSheets += 1;
      reasons.push(`${sheetName} 匹配顾问进度表特征`);
    }
  }

  const sheetRatio = workbook.SheetNames.length === 0 ? 0 : matchedSheets / workbook.SheetNames.length;
  const confidence = Math.min(1, sheetRatio * 0.8 + (matchedSheets >= 2 ? 0.2 : 0));

  return {
    layout: confidence >= 0.5 ? "COUNSELOR_PROGRESS" : "UNKNOWN",
    confidence,
    sheetName: matchedSheets === 1 ? workbook.SheetNames[0] : undefined,
    reasons,
  };
}

export function detectLayout(workbook: WorkBook): WorkbookLayout {
  return detectLayoutDetailed(workbook).layout;
}

export function detectLayoutDetailed(workbook: WorkBook): LayoutDetectionResult {
  const master = detectMaster(workbook);
  const counselor = detectCounselorProgress(workbook);

  if (master.confidence >= counselor.confidence && master.layout !== "UNKNOWN") {
    return master;
  }

  if (counselor.layout !== "UNKNOWN") {
    return counselor;
  }

  return {
    layout: "UNKNOWN",
    confidence: Math.max(master.confidence, counselor.confidence),
    reasons: [...master.reasons, ...counselor.reasons].filter(Boolean),
  };
}
