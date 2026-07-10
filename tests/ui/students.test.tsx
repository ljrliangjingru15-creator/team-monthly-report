import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StudentsPage from "@/app/students/page";
import { buildStudentManualEditChanges } from "@/features/students/edit";
import { filterStudentsForActor } from "@/features/students/filters";
import { buildStudentDetailView } from "@/features/students/view-model";
import type { StudentRecord } from "@/features/students/types";
import type { Actor } from "@/features/permissions/types";

const admin: Actor = { id: "admin", name: "管理员", role: "ADMIN" };
const leader: Actor = {
  id: "leader",
  name: "组长",
  roleAssignments: [{ role: "LEADER" }, { role: "COUNSELOR" }],
};
const counselor: Actor = {
  id: "counselor-1",
  name: "顾问甲",
  role: "COUNSELOR",
};

const students: StudentRecord[] = [
  {
    id: "student-1",
    season: "2027 Fall",
    name: "测试学生甲",
    counselor: "顾问甲",
    counselorUserId: "counselor-1",
    applicationType: "美本",
    currentStage: "文书",
    handoffStatus: "UNCONFIRMED",
    contractNumber: "CONTRACT-001",
    contractType: "常规合同",
    contractAmount: 100000,
    email: "own@example.com",
    currentSchool: "测试高中",
    backgroundSummary: "背景摘要",
  },
  {
    id: "student-2",
    season: "2027 Fall",
    name: "测试学生乙",
    counselor: "顾问乙",
    counselorUserId: "counselor-2",
    applicationType: "美研",
    currentStage: "递交",
    handoffStatus: "CONFIRMED",
    contractAmount: 120000,
    email: "other@example.com",
  },
];

describe("students page", () => {
  it("renders the student management entry", () => {
    render(<StudentsPage />);

    expect(
      screen.getByRole("heading", { name: "学生列表" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/合同金额和邮箱会按角色权限显示/)).toBeInTheDocument();
  });
});

describe("student filtering and visibility", () => {
  it("limits counselors to their own students", () => {
    expect(filterStudentsForActor(counselor, students).map((item) => item.id)).toEqual([
      "student-1",
    ]);
  });

  it("allows leaders to see team-wide students and switch to own workspace", () => {
    expect(filterStudentsForActor(leader, students)).toHaveLength(2);
    expect(
      filterStudentsForActor(
        { ...leader, id: "counselor-1", name: "顾问甲" },
        students,
        { myStudentsOnly: true },
      ).map((item) => item.id),
    ).toEqual(["student-1"]);
  });

  it("supports search and structured filters", () => {
    expect(
      filterStudentsForActor(admin, students, {
        search: "测试高中",
        applicationType: "美本",
        currentStage: "文书",
      }).map((item) => item.id),
    ).toEqual(["student-1"]);
  });

  it("hides contract amount from counselors but keeps own-student email visible", () => {
    const view = buildStudentDetailView(counselor, students[0]);

    expect(view.contractAmountVisible).toBe(false);
    expect(view.contractAmount).toBeUndefined();
    expect(view.emailVisible).toBe(true);
    expect(view.email).toBe("own@example.com");
  });

  it("shows contract amount and all emails to leaders", () => {
    const view = buildStudentDetailView(leader, students[1]);

    expect(view.contractAmountVisible).toBe(true);
    expect(view.contractAmount).toBe(120000);
    expect(view.emailVisible).toBe(true);
    expect(view.email).toBe("other@example.com");
  });

  it("builds audit changes for allowed manual edits only", () => {
    expect(
      buildStudentManualEditChanges(counselor, students[0], {
        currentStage: "递交",
        contractAmount: 999999,
      }),
    ).toEqual([
      expect.objectContaining({
        fieldName: "currentStage",
        oldValue: "文书",
        newValue: "递交",
      }),
    ]);
  });

  it("blocks counselors from editing other students", () => {
    expect(() =>
      buildStudentManualEditChanges(counselor, students[1], {
        currentStage: "递交",
      }),
    ).toThrow("无权编辑");
  });
});
