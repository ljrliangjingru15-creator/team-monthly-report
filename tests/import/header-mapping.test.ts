import { describe, expect, it } from "vitest";
import { detectLayout, detectLayoutDetailed } from "@/features/import/detect-layout";
import { mapHeaders } from "@/features/import/map-headers";
import { normalizeHeader } from "@/features/import/normalize-header";
import { collectSensitiveHeaders } from "@/features/import/sensitive-fields";
import {
  buildCounselorWorkbook,
  buildMasterWorkbook,
  buildUnknownWorkbook,
  counselorHeaders,
  masterHeaders,
} from "../fixtures/build-workbooks";

describe("workbook layout detection", () => {
  it("detects the master workbook by 2026申请 and master headers", () => {
    expect(detectLayout(buildMasterWorkbook())).toBe("STUDENT_MASTER");

    expect(detectLayoutDetailed(buildMasterWorkbook())).toMatchObject({
      layout: "STUDENT_MASTER",
      sheetName: "2026申请",
    });
  });

  it("detects counselor progress workbooks with multiple student sheets", () => {
    expect(detectLayout(buildCounselorWorkbook())).toBe("COUNSELOR_PROGRESS");
  });

  it("returns UNKNOWN for unrelated workbooks", () => {
    expect(detectLayout(buildUnknownWorkbook())).toBe("UNKNOWN");
  });
});

describe("header normalization and mapping", () => {
  it("normalizes spaces, punctuation, full-width characters and case", () => {
    expect(normalizeHeader(" DＤL：\n")).toBe("ddl");
    expect(normalizeHeader("Common App")).toBe("commonapp");
  });

  it("maps aliases to system fields", () => {
    const result = mapHeaders(["姓名", "负责顾问", "DDL"]);

    expect(result.fields).toMatchObject({
      name: 0,
      counselor: 1,
      deadline: 2,
    });
    expect(result).toMatchObject({
      name: 0,
      counselor: 1,
      deadline: 2,
    });
  });

  it("maps real-like master and counselor headers", () => {
    expect(mapHeaders(masterHeaders).fields).toMatchObject({
      name: 2,
      counselor: 3,
      contractNumber: 9,
      contractAmount: 11,
      backgroundSummary: 18,
      posterBackground: 19,
    });

    expect(mapHeaders(counselorHeaders).fields).toMatchObject({
      name: 0,
      email: 1,
      schoolName: 2,
      deadline: 7,
      result: 12,
    });
  });

  it("detects and skips sensitive columns before alias mapping", () => {
    const result = mapHeaders([
      "学生姓名",
      "学生电话",
      "账号",
      "密码",
      "ID/password",
      "申请学校",
    ]);

    expect(result.fields).toMatchObject({
      name: 0,
      schoolName: 5,
    });
    expect(result.ignoredSensitive).toEqual([1, 2, 3, 4]);
    expect(result.sensitiveMatches.map((match) => match.category)).toEqual([
      "phone",
      "accountCredential",
      "password",
      "accountCredential",
    ]);
  });

  it("collects sensitive headers without exposing cell values", () => {
    expect(collectSensitiveHeaders(["密码", "家长电话"])).toEqual([
      expect.objectContaining({ index: 0, category: "password" }),
      expect.objectContaining({ index: 1, category: "phone" }),
    ]);
  });

  it("tracks duplicates and unknown headers", () => {
    const result = mapHeaders(["学生姓名", "姓名", "未知字段"]);

    expect(result.fields.name).toBe(0);
    expect(result.duplicates.name).toEqual([0, 1]);
    expect(result.unknown).toEqual([{ index: 2, header: "未知字段" }]);
  });
});
