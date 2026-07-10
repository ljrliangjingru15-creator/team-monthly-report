import { describe, expect, it, vi } from "vitest";
import {
  buildCommitPlan,
  commitImportPreview,
} from "@/features/import/commit-import";
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
  },
};

const incomingApplication: ParsedApplicationCandidate = {
  source: { sheetName: "1. 测试学生甲", rowNumber: 2 },
  data: {
    studentName: "测试学生甲",
    schoolName: "Test University",
    major: "Economics",
    round: "EA",
    applicationStatus: "未提交",
  },
};

function previewWithConflicts() {
  return buildImportPreview({
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
        applicationStatus: "准备中",
      },
    ],
  });
}

describe("commit plan", () => {
  it("blocks commit while conflicts are unresolved", () => {
    const preview = previewWithConflicts();
    const plan = buildCommitPlan(preview, []);

    expect(plan).toMatchObject({
      status: "blocked",
      reason: "unresolved_conflicts",
    });
    if (plan.status === "blocked") {
      expect(plan.unresolvedConflicts.length).toBeGreaterThan(0);
    }
  });

  it("supports bulk use-incoming confirmation", () => {
    const preview = previewWithConflicts();
    const plan = buildCommitPlan(preview, [
      { conflictId: "*", action: "use_incoming" },
    ]);

    expect(plan.status).toBe("ready");
    if (plan.status === "ready") {
      expect(plan.operations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "update_student",
            entityId: "student-1",
            changes: expect.objectContaining({ counselor: "顾问新" }),
          }),
          expect.objectContaining({
            type: "update_application",
            entityId: "application-1",
            changes: expect.objectContaining({ applicationStatus: "未提交" }),
          }),
          expect.objectContaining({ type: "write_conflict_log" }),
        ]),
      );
    }
  });

  it("can keep existing values for selected conflicts", () => {
    const preview = previewWithConflicts();
    const plan = buildCommitPlan(preview, [
      { conflictId: "*", action: "use_existing" },
    ]);

    expect(plan.status).toBe("ready");
    if (plan.status === "ready") {
      expect(plan.operations).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: "update_student" }),
          expect.objectContaining({ type: "update_application" }),
        ]),
      );
      expect(plan.operations).toEqual(
        expect.arrayContaining([expect.objectContaining({ type: "write_conflict_log" })]),
      );
    }
  });

  it("does not call the transaction when preview is canceled or conflicts are unresolved", async () => {
    const preview = previewWithConflicts();
    const transaction = vi.fn();

    const result = await commitImportPreview(preview, [], transaction);

    expect(result.status).toBe("blocked");
    expect(transaction).not.toHaveBeenCalled();
  });

  it("runs all ready operations through the provided transaction boundary", async () => {
    const preview = previewWithConflicts();
    const transaction = vi.fn(async (operations) => ({
      committedOperations: operations.length,
    }));

    const result = await commitImportPreview(
      preview,
      [{ conflictId: "*", action: "use_incoming" }],
      transaction,
    );

    expect(result.status).toBe("committed");
    expect(transaction).toHaveBeenCalledTimes(1);
    if (result.status === "committed") {
      expect(result.result.committedOperations).toBe(result.operations.length);
    }
  });

  it("propagates transaction errors so callers can roll back", async () => {
    const preview = previewWithConflicts();
    const transaction = vi.fn(async () => {
      throw new Error("transaction failed");
    });

    await expect(
      commitImportPreview(
        preview,
        [{ conflictId: "*", action: "use_incoming" }],
        transaction,
      ),
    ).rejects.toThrow("transaction failed");
  });
});
