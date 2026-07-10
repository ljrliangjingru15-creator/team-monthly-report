import { buildChangeLogData } from "@/features/audit/write-change-log";
import type { Actor } from "@/features/permissions/types";
import { canAccessStudent } from "@/features/permissions/rules";
import type {
  FinalizationAnomaly,
  HandoffIssueDraft,
  HandoffIssueFilters,
  HandoffIssueRecord,
  HandoffIssueStatus,
} from "./types";

const validTransitions: Record<HandoffIssueStatus, HandoffIssueStatus[]> = {
  TODO: ["IN_PROGRESS", "WAITING", "RESOLVED", "DEFERRED"],
  IN_PROGRESS: ["WAITING", "RESOLVED", "DEFERRED"],
  WAITING: ["IN_PROGRESS", "RESOLVED", "DEFERRED"],
  RESOLVED: ["IN_PROGRESS"],
  DEFERRED: ["IN_PROGRESS", "RESOLVED"],
};

export function createIssueDraftFromAnomaly(
  draft: Omit<HandoffIssueDraft, "issueType" | "description" | "priority">,
  anomaly: FinalizationAnomaly,
): HandoffIssueDraft {
  return {
    ...draft,
    issueType: anomaly.type,
    description: anomaly.message,
    priority: anomaly.priority,
  };
}

export function transitionHandoffIssue(
  issue: HandoffIssueRecord,
  nextStatus: HandoffIssueStatus,
  options: { resolution?: string; now?: Date } = {},
) {
  if (!validTransitions[issue.status].includes(nextStatus)) {
    throw new Error(`交接问题不能从 ${issue.status} 直接流转到 ${nextStatus}`);
  }

  const after: HandoffIssueRecord = {
    ...issue,
    status: nextStatus,
    resolution: options.resolution ?? issue.resolution,
    resolvedAt: nextStatus === "RESOLVED" ? options.now ?? new Date() : issue.resolvedAt,
  };

  return {
    issue: after,
    changes: buildChangeLogData(issue, {
      status: after.status,
      resolution: after.resolution,
      resolvedAt: after.resolvedAt,
    }),
  };
}

export function filterHandoffIssuesForActor(
  actor: Actor,
  issues: HandoffIssueRecord[],
  filters: HandoffIssueFilters = {},
) {
  return issues
    .filter((issue) => canAccessStudent(actor, issue.student))
    .filter((issue) => (filters.counselor ? issue.counselor === filters.counselor : true))
    .filter((issue) =>
      filters.midTermCounselor ? issue.midTermCounselor === filters.midTermCounselor : true,
    )
    .filter((issue) => (filters.status ? issue.status === filters.status : true))
    .filter((issue) => (filters.priority ? issue.priority === filters.priority : true))
    .filter((issue) => (filters.issueType ? issue.issueType === filters.issueType : true))
    .filter((issue) => (filters.ownerName ? issue.ownerName === filters.ownerName : true));
}

export function summarizeHandoffIssues(issues: HandoffIssueRecord[]) {
  return {
    total: issues.length,
    open: issues.filter((issue) => !["RESOLVED", "DEFERRED"].includes(issue.status)).length,
    resolved: issues.filter((issue) => issue.status === "RESOLVED").length,
    waiting: issues.filter((issue) => issue.status === "WAITING").length,
    byMidTermCounselor: Object.entries(
      issues.reduce<Record<string, number>>((acc, issue) => {
        const key = issue.midTermCounselor ?? "未填写";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([midTermCounselor, count]) => ({ midTermCounselor, count })),
    byCounselor: Object.entries(
      issues.reduce<Record<string, number>>((acc, issue) => {
        const key = issue.counselor ?? "未分配";
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    ).map(([counselor, count]) => ({ counselor, count })),
  };
}
