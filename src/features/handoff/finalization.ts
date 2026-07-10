import type {
  FinalizationAnomaly,
  SchoolFinalizationInput,
  SchoolFinalizationStatus,
} from "./types";

function cleanSchoolName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function uniqueSchoolNames(input: SchoolFinalizationInput) {
  return Array.from(
    new Set(
      input.applications
        .map((application) => application.schoolName)
        .filter(Boolean)
        .map(cleanSchoolName),
    ),
  );
}

export function suggestFinalizationStatus(
  anomalies: FinalizationAnomaly[],
): SchoolFinalizationStatus {
  if (anomalies.length === 0) return "CONFIRMED";
  if (anomalies.some((issue) => issue.priority === "HIGH" || issue.priority === "URGENT")) {
    return "QUESTIONED";
  }
  return "NEEDS_INFO";
}

export function detectFinalizationAnomalies(
  input: SchoolFinalizationInput,
): FinalizationAnomaly[] {
  const anomalies: FinalizationAnomaly[] = [];
  const schoolNames = uniqueSchoolNames(input);
  const systemCount = input.systemSchoolCount ?? schoolNames.length;

  const expectedCounts = [
    input.expectedSchoolCount,
    input.contractSchoolCount,
  ].filter((count): count is number => typeof count === "number");

  for (const expectedCount of expectedCounts) {
    if (expectedCount !== systemCount) {
      anomalies.push({
        type: "SCHOOL_COUNT_MISMATCH",
        message: `系统申请数量 ${systemCount} 与预期/合同定校数量 ${expectedCount} 不一致`,
        priority: "HIGH",
      });
    }
  }

  const confirmedSchools = (input.confirmedSchoolNames ?? []).map(cleanSchoolName);

  for (const confirmedSchool of confirmedSchools) {
    if (!schoolNames.includes(confirmedSchool)) {
      anomalies.push({
        type: "MISSING_APPLICATION_SCHOOL",
        message: `已确认定校 ${confirmedSchool} 未在申请项中找到`,
        priority: "HIGH",
        schoolName: confirmedSchool,
      });
    }
  }

  for (const schoolName of schoolNames) {
    if (confirmedSchools.length > 0 && !confirmedSchools.includes(schoolName)) {
      anomalies.push({
        type: "EXTRA_APPLICATION_SCHOOL",
        message: `申请项 ${schoolName} 不在已确认定校列表中`,
        priority: "MEDIUM",
        schoolName,
      });
    }
  }

  for (const application of input.applications) {
    if (!application.deadline) {
      anomalies.push({
        type: "MISSING_DDL",
        message: `${application.schoolName} 缺少 DDL`,
        priority: "HIGH",
        schoolName: application.schoolName,
      });
    }

    if (!application.applicationStatus) {
      anomalies.push({
        type: "UNCLEAR_APPLICATION_STATUS",
        message: `${application.schoolName} 申请状态不明确`,
        priority: "MEDIUM",
        schoolName: application.schoolName,
      });
    }
  }

  if (!input.student.backgroundSummary) {
    anomalies.push({
      type: "MISSING_BACKGROUND",
      message: "学生背景摘要缺失，可能影响月报、喜报和案例沉淀",
      priority: "MEDIUM",
    });
  }

  if (input.isSpecialStructure) {
    anomalies.push({
      type: "SPECIAL_SHEET_REVIEW",
      message: "该学生来自特殊结构 Sheet，需人工确认定校和申请项",
      priority: "MEDIUM",
    });
  }

  return anomalies;
}
