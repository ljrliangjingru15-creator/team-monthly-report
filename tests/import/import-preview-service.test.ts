import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import {
  buildCounselorWorkbook,
  buildMasterWorkbook,
} from "../fixtures/build-workbooks";
import { previewUploadedWorkbook } from "@/features/import/import-preview-service";

function toBuffer(workbook: XLSX.WorkBook) {
  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;
}

describe("uploaded workbook preview service", () => {
  it("previews a master workbook upload and reports protected contract amount changes", () => {
    const result = previewUploadedWorkbook({
      fileName: "总表.xlsx",
      buffer: toBuffer(buildMasterWorkbook()),
      season: "2027 Fall",
      existingStudents: [
        {
          id: "student-1",
          season: "2027 Fall",
          name: "测试学生甲",
          counselor: "顾问甲",
          contractNumber: "CONTRACT-001",
          contractAmount: 90000,
        },
      ],
      existingApplications: [],
    });

    expect(result.layout).toBe("STUDENT_MASTER");
    expect(result.fileName).toBe("总表.xlsx");
    expect(result.preview.summary.updatedStudents).toBe(1);
    expect(result.preview.conflicts.map((conflict) => conflict.fieldName)).toContain(
      "contractAmount",
    );
  });

  it("previews a counselor workbook upload and strips phone/password/account fields", () => {
    const result = previewUploadedWorkbook({
      fileName: "顾问进度表.xlsx",
      buffer: toBuffer(buildCounselorWorkbook()),
      season: "2027 Fall",
      existingStudents: [],
      existingApplications: [],
    });

    expect(result.layout).toBe("COUNSELOR_PROGRESS");
    expect(result.preview.summary.createdStudents).toBe(2);
    expect(result.preview.summary.createdApplications).toBe(2);
    expect(result.preview.summary.sensitiveFields).toBeGreaterThanOrEqual(2);
    expect(result.preview.sensitiveFields.map((field) => field.category)).toEqual(
      expect.arrayContaining(["phone", "password", "accountCredential"]),
    );
  });
});
