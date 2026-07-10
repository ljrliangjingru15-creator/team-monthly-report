import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdmissionsPage from "@/app/admissions/page";
import { filterAdmissionResultsForActor, summarizeAdmissionResults } from "@/features/admissions/filters";
import { syncAdmissionResultsFromApplications } from "@/features/admissions/sync";
import type { ApplicationWithStudent } from "@/features/applications/types";
import type { Actor } from "@/features/permissions/types";

const counselor: Actor = { id: "counselor-1", name: "顾问甲", role: "COUNSELOR" };
const leader: Actor = {
  id: "leader",
  name: "组长",
  roleAssignments: [{ role: "LEADER" }, { role: "COUNSELOR" }],
};

const applications: ApplicationWithStudent[] = [
  {
    id: "application-1",
    studentId: "student-1",
    studentName: "测试学生甲",
    counselor: "顾问甲",
    counselorUserId: "counselor-1",
    season: "2027 Fall",
    schoolName: "Offer University",
    major: "Economics",
    result: "accepted",
    enrollmentStatus: "待确认",
    student: {
      id: "student-1",
      season: "2027 Fall",
      name: "测试学生甲",
      counselor: "顾问甲",
      counselorUserId: "counselor-1",
      backgroundSummary: "背景摘要",
      posterBackground: "喜报背景",
    },
  },
  {
    id: "application-2",
    studentId: "student-2",
    studentName: "测试学生乙",
    counselor: "顾问乙",
    counselorUserId: "counselor-2",
    season: "2027 Fall",
    schoolName: "Reject College",
    result: "Rejected",
    student: {
      id: "student-2",
      season: "2027 Fall",
      name: "测试学生乙",
      counselor: "顾问乙",
      counselorUserId: "counselor-2",
    },
  },
  {
    id: "application-3",
    studentId: "student-2",
    studentName: "测试学生乙",
    counselor: "顾问乙",
    counselorUserId: "counselor-2",
    season: "2027 Fall",
    schoolName: "Waiting College",
    result: "waitlist",
    student: {
      id: "student-2",
      season: "2027 Fall",
      name: "测试学生乙",
      counselor: "顾问乙",
      counselorUserId: "counselor-2",
    },
  },
];

describe("admissions page", () => {
  it("renders the admission results entry", () => {
    render(<AdmissionsPage />);
    expect(
      screen.getByRole("heading", { name: "录取结果统计" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/录取喜报和内部案例/)).toBeInTheDocument();
  });
});

describe("admission sync and filters", () => {
  it("syncs application results into admission records", () => {
    const results = syncAdmissionResultsFromApplications(applications);

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          applicationId: "application-1",
          result: "录取",
          canGeneratePoster: true,
          backgroundSummary: "背景摘要",
          posterBackground: "喜报背景",
        }),
        expect.objectContaining({
          applicationId: "application-2",
          result: "拒绝",
          canGeneratePoster: false,
        }),
        expect.objectContaining({
          applicationId: "application-3",
          result: "waitlist",
        }),
      ]),
    );
  });

  it("applies role data scope", () => {
    const results = syncAdmissionResultsFromApplications(applications);
    expect(filterAdmissionResultsForActor(counselor, results).map((item) => item.id)).toEqual([
      "admission:application-1",
    ]);
    expect(filterAdmissionResultsForActor(leader, results)).toHaveLength(3);
  });

  it("filters and summarizes result states", () => {
    const results = syncAdmissionResultsFromApplications(applications);

    expect(
      filterAdmissionResultsForActor(leader, results, {
        result: "录取",
        canGeneratePoster: true,
      }).map((item) => item.schoolName),
    ).toEqual(["Offer University"]);

    expect(summarizeAdmissionResults(results)).toMatchObject({
      total: 3,
      admitted: 1,
      rejected: 1,
      waitlist: 1,
      posterReady: 1,
      caseReady: 3,
    });
  });
});
