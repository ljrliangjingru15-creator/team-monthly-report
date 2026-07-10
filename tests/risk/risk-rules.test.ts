import { describe, expect, it } from "vitest";
import { assessDdlRisk } from "@/features/risk/ddl-risk";
import { buildRiskApplications } from "@/features/risk/filter-risk";
import type { ApplicationWithStudent } from "@/features/applications/types";
import type { Actor } from "@/features/permissions/types";

const today = new Date(Date.UTC(2026, 6, 7));
const counselor: Actor = {
  id: "counselor-1",
  name: "顾问甲",
  role: "COUNSELOR",
};
const leader: Actor = {
  id: "leader",
  name: "组长",
  roleAssignments: [{ role: "LEADER" }, { role: "COUNSELOR" }],
};

function application(
  overrides: Partial<ApplicationWithStudent>,
): ApplicationWithStudent {
  return {
    id: "app",
    studentId: "student-1",
    studentName: "测试学生甲",
    counselor: "顾问甲",
    counselorUserId: "counselor-1",
    season: "2027 Fall",
    schoolName: "Test University",
    applicationStatus: "未提交",
    deadline: new Date(Date.UTC(2026, 6, 22)),
    student: {
      id: "student-1",
      season: "2027 Fall",
      name: "测试学生甲",
      counselor: "顾问甲",
      counselorUserId: "counselor-1",
    },
    ...overrides,
  };
}

describe("DDL risk rules", () => {
  it("marks deadlines more than 14 days away as normal", () => {
    expect(
      assessDdlRisk(
        application({ deadline: new Date(Date.UTC(2026, 6, 23)) }),
        today,
      ),
    ).toMatchObject({ level: "NORMAL", daysUntilDeadline: 16 });
  });

  it("marks 8-14 day deadlines as watch", () => {
    expect(
      assessDdlRisk(
        application({ deadline: new Date(Date.UTC(2026, 6, 20)) }),
        today,
      ),
    ).toMatchObject({ level: "WATCH", daysUntilDeadline: 13 });
  });

  it("marks 1-7 day deadlines as high risk", () => {
    expect(
      assessDdlRisk(
        application({ deadline: new Date(Date.UTC(2026, 6, 10)) }),
        today,
      ),
    ).toMatchObject({ level: "HIGH", daysUntilDeadline: 3 });
  });

  it("marks overdue unsubmitted applications as overdue", () => {
    expect(
      assessDdlRisk(
        application({ deadline: new Date(Date.UTC(2026, 6, 1)) }),
        today,
      ),
    ).toMatchObject({ level: "OVERDUE" });
  });

  it("does not warn on submitted applications without pending post-submit work", () => {
    expect(
      assessDdlRisk(
        application({
          deadline: new Date(Date.UTC(2026, 6, 1)),
          applicationStatus: "已提交",
          submittedAt: new Date(Date.UTC(2026, 5, 30)),
          materialStatus: "已完成",
          interviewStatus: "无需",
        }),
        today,
      ),
    ).toMatchObject({ level: "NORMAL" });
  });

  it("keeps submitted applications visible when post-submit work is pending", () => {
    expect(
      assessDdlRisk(
        application({
          deadline: new Date(Date.UTC(2026, 6, 1)),
          applicationStatus: "已提交",
          submittedAt: new Date(Date.UTC(2026, 5, 30)),
          materialStatus: "补件待处理",
        }),
        today,
      ),
    ).toMatchObject({ level: "WATCH" });
  });
});

describe("risk list filtering", () => {
  const applications: ApplicationWithStudent[] = [
    application({
      id: "own-high",
      schoolName: "High University",
      deadline: new Date(Date.UTC(2026, 6, 10)),
    }),
    application({
      id: "other-overdue",
      studentId: "student-2",
      studentName: "测试学生乙",
      counselor: "顾问乙",
      counselorUserId: "counselor-2",
      schoolName: "Late College",
      deadline: new Date(Date.UTC(2026, 6, 1)),
      student: {
        id: "student-2",
        season: "2027 Fall",
        name: "测试学生乙",
        counselor: "顾问乙",
        counselorUserId: "counselor-2",
      },
    }),
  ];

  it("applies actor data scope before risk filtering", () => {
    expect(
      buildRiskApplications(counselor, applications, {}, today).map((item) => item.id),
    ).toEqual(["own-high"]);
    expect(buildRiskApplications(leader, applications, {}, today)).toHaveLength(2);
  });

  it("filters by level and school", () => {
    expect(
      buildRiskApplications(
        leader,
        applications,
        { level: "OVERDUE", schoolName: "Late" },
        today,
      ).map((item) => item.id),
    ).toEqual(["other-overdue"]);
  });
});
