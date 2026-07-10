import { describe, expect, it } from "vitest";
import { diffRecords } from "@/features/import/diff-records";
import { buildImportPreview } from "@/features/import/preview-import";
import type {
  ParsedApplicationCandidate,
  ParsedStudentCandidate,
} from "@/features/import/types";

const incomingStudent: ParsedStudentCandidate = {
  source: { sheetName: "2026申请", rowNumber: 4 },
  data: {
    season: "2027 Fall",
    name: "测试学生甲",
    counselor: "顾问新",
    contractNumber: "CONTRACT-001",
    contractAmount: 120000,
  },
};

const incomingApplication: ParsedApplicationCandidate = {
  source: { sheetName: "1. 测试学生甲", rowNumber: 2 },
  data: {
    studentName: "测试学生甲",
    schoolName: "Test University",
    major: "Economics",
    round: "EA",
    deadline: new Date(Date.UTC(2027, 0, 1)),
    applicationStatus: "未提交",
  },
};

describe("record diffing", () => {
  it("does not treat empty incoming cells as overwrites", () => {
    expect(
      diffRecords(
        { counselor: "顾问甲" },
        { counselor: "" },
        {
          entityType: "student",
          entityId: "student-1",
          source: { sheetName: "2026申请", rowNumber: 4 },
          protectedFields: ["counselor"],
        },
      ),
    ).toEqual({ changes: [], conflicts: [] });
  });

  it("marks protected or existing-value changes as conflicts", () => {
    const diff = diffRecords(
      { counselor: "顾问甲", backgroundSummary: "旧背景" },
      { counselor: "顾问新", backgroundSummary: "新背景" },
      {
        entityType: "student",
        entityId: "student-1",
        source: { sheetName: "2026申请", rowNumber: 4 },
        protectedFields: ["counselor"],
      },
    );

    expect(diff.changes).toHaveLength(2);
    expect(diff.conflicts.map((conflict) => conflict.fieldName)).toEqual([
      "counselor",
      "backgroundSummary",
    ]);
  });
});

describe("import preview", () => {
  it("classifies created, updated, conflicts, skipped and sensitive fields", () => {
    const preview = buildImportPreview({
      students: [incomingStudent],
      applications: [incomingApplication],
      existingStudents: [
        {
          id: "student-1",
          season: "2027 Fall",
          name: "测试学生甲",
          counselor: "顾问甲",
          contractNumber: "CONTRACT-001",
        },
      ],
      existingApplications: [
        {
          id: "application-1",
          studentId: "student-1",
          schoolName: "Test University",
          major: "Economics",
          round: "EA",
          deadline: new Date(Date.UTC(2026, 11, 15)),
          applicationStatus: "准备中",
        },
      ],
      skippedFields: ["学生电话"],
      sensitiveFields: [{ fieldName: "密码", category: "password" }],
    });

    expect(preview.createdStudents).toHaveLength(0);
    expect(preview.updatedStudents).toHaveLength(1);
    expect(preview.updatedApplications).toHaveLength(1);
    expect(preview.conflicts.map((conflict) => conflict.fieldName)).toEqual(
      expect.arrayContaining([
        "counselor",
        "contractAmount",
        "deadline",
        "applicationStatus",
      ]),
    );
    expect(preview.summary).toMatchObject({
      updatedStudents: 1,
      updatedApplications: 1,
      skippedFields: 1,
      sensitiveFields: 1,
    });
  });

  it("sends ambiguous matches and special sheets to manual review", () => {
    const preview = buildImportPreview({
      students: [incomingStudent],
      applications: [{ ...incomingApplication, needsReview: true }],
      existingStudents: [
        {
          id: "student-1",
          season: "2027 Fall",
          name: "测试学生甲",
          counselor: "顾问甲",
          contractNumber: "CONTRACT-001",
        },
        {
          id: "student-2",
          season: "2027 Fall",
          name: "测试学生乙",
          counselor: "顾问乙",
          contractNumber: "CONTRACT-001",
        },
      ],
      existingApplications: [],
    });

    expect(preview.manualReview.map((issue) => issue.issueType)).toEqual(
      expect.arrayContaining([
        "ambiguous_student_match",
        "application_needs_review",
        "application_student_match_ambiguous",
      ]),
    );
    expect(preview.updatedStudents).toHaveLength(0);
  });

  it("creates new records when no match exists", () => {
    const preview = buildImportPreview({
      students: [incomingStudent],
      applications: [incomingApplication],
      existingStudents: [],
      existingApplications: [],
    });

    expect(preview.createdStudents).toHaveLength(1);
    expect(preview.createdApplications).toHaveLength(1);
    expect(preview.summary).toMatchObject({
      createdStudents: 1,
      createdApplications: 1,
    });
  });
});
