import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LogsPage from "@/app/logs/page";
import { filterAuditLogs, summarizeAuditLogs } from "@/features/audit/logs";
import { buildChangeLogData } from "@/features/audit/write-change-log";
import type { AuditLogRecord } from "@/features/audit/logs";

const logs: AuditLogRecord[] = [
  {
    id: "log-1",
    entityType: "STUDENT",
    entityId: "student-1",
    fieldName: "currentStage",
    oldValue: "文书",
    newValue: "递交",
    changedByName: "顾问甲",
    changeSource: "MANUAL",
    changedAt: new Date(Date.UTC(2026, 6, 1)),
  },
  {
    id: "log-2",
    entityType: "APPLICATION",
    entityId: "application-1",
    fieldName: "deadline",
    oldValue: "2026-01-01",
    newValue: "2026-01-02",
    changedByName: "管理员",
    changeSource: "EXCEL_IMPORT",
    changedAt: new Date(Date.UTC(2026, 6, 2)),
  },
];

describe("logs page", () => {
  it("renders the audit log entry", () => {
    render(<LogsPage />);
    expect(screen.getByRole("heading", { name: "日志与审计" })).toBeInTheDocument();
    expect(screen.getByText(/敏感字段不得进入日志/)).toBeInTheDocument();
  });
});

describe("audit log helpers", () => {
  it("filters and summarizes logs", () => {
    expect(
      filterAuditLogs(logs, {
        entityType: "APPLICATION",
        changeSource: "EXCEL_IMPORT",
      }),
    ).toEqual([logs[1]]);

    expect(summarizeAuditLogs(logs)).toEqual({
      total: 2,
      manual: 1,
      import: 1,
      system: 0,
    });
  });

  it("filters sensitive fields out of change logs", () => {
    expect(
      buildChangeLogData(
        {
          currentStage: "文书",
          contractAmount: 100000,
          studentPhone: "123",
          portalPassword: "secret",
        },
        {
          currentStage: "递交",
          contractAmount: 120000,
          studentPhone: "456",
          portalPassword: "new-secret",
        },
      ),
    ).toEqual([
      expect.objectContaining({
        fieldName: "currentStage",
        oldValue: "文书",
        newValue: "递交",
      }),
    ]);
  });
});
