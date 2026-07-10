import { describe, expect, it } from "vitest";
import { matchApplication } from "@/features/import/match-application";
import { matchStudent } from "@/features/import/match-student";
import { normalizeDate, normalizeResult, normalizeRound } from "@/features/import/normalize-value";
import { parseCounselorWorkbook } from "@/features/import/parse-counselor-workbook";
import { parseMasterSheet } from "@/features/import/parse-master-sheet";
import {
  buildCounselorWorkbook,
  buildMasterWorkbook,
} from "../fixtures/build-workbooks";

describe("workbook parsing", () => {
  it("parses master sheets into student candidates", () => {
    const result = parseMasterSheet(buildMasterWorkbook(), { season: "2027 Fall" });

    expect(result.issues).toEqual([]);
    expect(result.students).toHaveLength(1);
    expect(result.students[0]).toMatchObject({
      source: { sheetName: "2026申请", rowNumber: 4 },
      data: {
        season: "2027 Fall",
        name: "测试学生甲",
        counselor: "顾问甲",
        contractNumber: "CONTRACT-001",
        contractType: "常规合同",
        contractAmount: 100000,
        currentSchool: "测试高中",
        curriculum: "AP",
        backgroundSummary: "背景摘要",
        posterBackground: "喜报背景",
      },
    });
  });

  it("parses counselor progress workbooks into applications and review items", () => {
    const result = parseCounselorWorkbook(buildCounselorWorkbook(), {
      season: "2027 Fall",
    });

    expect(result.students.map((student) => student.data.name)).toEqual(
      expect.arrayContaining(["测试学生甲", "特殊结构"]),
    );
    expect(result.applications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            studentName: "测试学生甲",
            studentEmail: "student@example.com",
            schoolName: "Test University",
            applicationMethod: "Common App",
            college: "College of Arts",
            major: "Economics",
            round: "EA",
            applicationStatus: "未提交",
          }),
        }),
        expect.objectContaining({
          needsReview: true,
          reviewReason: "该 Sheet 可能是特殊结构或学生姓名由 Sheet 名推断",
          data: expect.objectContaining({
            studentName: "特殊结构",
            schoolName: "Special College",
            deadline: new Date(Date.UTC(2027, 1, 1)),
          }),
        }),
      ]),
    );
  });

  it("creates admission result candidates when result is present", () => {
    const result = parseCounselorWorkbook(buildCounselorWorkbook(), {
      season: "2027 Fall",
    });

    expect(result.admissionResults).toEqual([]);
  });
});

describe("value normalization", () => {
  it("normalizes dates, rounds and results", () => {
    expect(normalizeDate(44927)).toEqual(new Date(Date.UTC(2023, 0, 1)));
    expect(normalizeRound("Early Action")).toBe("EA");
    expect(normalizeRound("RD")).toBe("RD");
    expect(normalizeResult("accepted")).toBe("录取");
    expect(normalizeResult("Rejected")).toBe("拒绝");
  });
});

describe("entity matching", () => {
  it("matches students by system id, contract number, then name/counselor/season", () => {
    const existing = [
      {
        id: "student-1",
        season: "2027 Fall",
        name: "测试学生甲",
        counselor: "顾问甲",
        contractNumber: "CONTRACT-001",
      },
    ];

    expect(
      matchStudent(
        {
          systemId: "student-1",
          season: "2027 Fall",
          name: "任意姓名",
        },
        existing,
      ),
    ).toMatchObject({ status: "matched", strategy: "system_id" });

    expect(
      matchStudent(
        {
          season: "2027 Fall",
          name: "测试学生甲",
          contractNumber: "CONTRACT-001",
        },
        existing,
      ),
    ).toMatchObject({ status: "matched", strategy: "contract_number" });

    expect(
      matchStudent(
        {
          season: "2027 Fall",
          name: "测试学生甲",
          counselor: "顾问甲",
        },
        existing,
      ),
    ).toMatchObject({ status: "matched", strategy: "name_counselor_season" });
  });

  it("marks duplicate student matches as ambiguous", () => {
    const duplicateStudents = [
      {
        id: "student-1",
        season: "2027 Fall",
        name: "测试学生甲",
        counselor: "顾问甲",
        contractNumber: "DUP",
      },
      {
        id: "student-2",
        season: "2027 Fall",
        name: "测试学生乙",
        counselor: "顾问乙",
        contractNumber: "DUP",
      },
    ];

    expect(
      matchStudent(
        {
          season: "2027 Fall",
          name: "测试学生甲",
          contractNumber: "DUP",
        },
        duplicateStudents,
      ),
    ).toMatchObject({
      status: "ambiguous",
      strategy: "contract_number",
      candidates: duplicateStudents,
    });
  });

  it("matches applications by student, school, major and round", () => {
    const existing = [
      {
        id: "application-1",
        studentId: "student-1",
        schoolName: "Test University",
        major: "Economics",
        round: "EA",
      },
    ];

    expect(
      matchApplication(
        {
          studentId: "student-1",
          studentName: "测试学生甲",
          schoolName: "Test University",
          major: "Economics",
          round: "EA",
        },
        existing,
      ),
    ).toMatchObject({
      status: "matched",
      strategy: "student_school_major_round",
      record: existing[0],
    });
  });

  it("does not auto-merge ambiguous applications", () => {
    const existing = [
      {
        id: "application-1",
        studentId: "student-1",
        schoolName: "Test University",
        major: "Economics",
        round: "EA",
      },
      {
        id: "application-2",
        studentId: "student-1",
        schoolName: "Test University",
        major: "Economics",
        round: "EA",
      },
    ];

    expect(
      matchApplication(
        {
          studentId: "student-1",
          studentName: "测试学生甲",
          schoolName: "Test University",
          major: "Economics",
          round: "EA",
        },
        existing,
      ),
    ).toMatchObject({
      status: "ambiguous",
      strategy: "student_school_major_round",
      candidates: existing,
    });
  });

  it("requires manual review when application matching lacks key fields", () => {
    expect(
      matchApplication(
        {
          studentName: "测试学生甲",
          schoolName: "Test University",
        },
        [],
      ),
    ).toMatchObject({
      status: "manual_review",
      strategy: "missing_match_fields",
      missingFields: ["studentId"],
    });
  });
});
