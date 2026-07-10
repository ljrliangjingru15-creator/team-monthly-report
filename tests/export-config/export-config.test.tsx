import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ExportConfigPage from "@/app/settings/export-config/page";
import { buildExportConfigAuditChanges } from "@/features/export-config/audit";
import {
  admissionPosterExportConfig,
  defaultExportConfigs,
  listExcelExportConfig,
  monthlyReportExportConfig,
} from "@/features/export-config/defaults";
import {
  assertCanEditExportConfig,
  assertCanViewExportConfig,
} from "@/features/export-config/permissions";
import { validateExportConfig } from "@/features/export-config/schema";
import { findDefaultExportConfig, summarizeExportConfig } from "@/features/export-config/summary";
import type { Actor } from "@/features/permissions/types";

const admin: Actor = { id: "admin", name: "管理员", role: "ADMIN" };
const leader: Actor = {
  id: "leader",
  name: "组长",
  roleAssignments: [{ role: "LEADER" }, { role: "COUNSELOR" }],
};
const counselor: Actor = { id: "counselor", name: "顾问", role: "COUNSELOR" };

describe("export config page", () => {
  it("renders the export config center", () => {
    render(<ExportConfigPage />);
    expect(
      screen.getByRole("heading", { name: "导出配置中心" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/默认隐藏合同金额、电话、账号密码和内部归因/)).toBeInTheDocument();
  });
});

describe("default export configs", () => {
  it("provides valid defaults for reports, posters, cases and list exports", () => {
    expect(defaultExportConfigs.map((config) => config.kind)).toEqual([
      "MONTHLY_REPORT",
      "ADMISSION_POSTER",
      "INTERNAL_CASE",
      "LIST_EXCEL",
    ]);

    for (const config of defaultExportConfigs) {
      expect(validateExportConfig(config)).toMatchObject({
        name: config.name,
        kind: config.kind,
      });
    }
  });

  it("keeps external templates redacted", () => {
    for (const config of [monthlyReportExportConfig, admissionPosterExportConfig]) {
      expect(config.redactionRules.audience).toBe("external");
      expect(config.redactionRules.alwaysHide).toEqual(
        expect.arrayContaining([
          "contractAmount",
          "studentPhone",
          "parentPhone",
          "password",
          "accountPassword",
          "internalResponsibility",
        ]),
      );
    }
  });

  it("keeps list export fields configurable", () => {
    expect(listExcelExportConfig.fieldRules.include).toEqual(
      expect.arrayContaining(["studentName", "schoolName", "deadline", "result"]),
    );
    expect(findDefaultExportConfig(defaultExportConfigs, "LIST_EXCEL")).toBe(
      listExcelExportConfig,
    );
  });

  it("summarizes configs for display", () => {
    expect(summarizeExportConfig(monthlyReportExportConfig)).toMatchObject({
      kind: "MONTHLY_REPORT",
      outputFormats: ["PDF", "PNG"],
      audience: "external",
    });
  });
});

describe("export config permissions and audit", () => {
  it("allows admins to edit, leaders to view and counselors to do neither", () => {
    expect(() => assertCanEditExportConfig(admin)).not.toThrow();
    expect(() => assertCanViewExportConfig(leader)).not.toThrow();
    expect(() => assertCanEditExportConfig(leader)).toThrow("无权修改");
    expect(() => assertCanViewExportConfig(counselor)).toThrow("无权查看");
  });

  it("builds audit changes for edited export rules", () => {
    const updated = {
      ...monthlyReportExportConfig,
      watermarkRules: { enabled: true, text: "客户反馈" },
    };

    expect(buildExportConfigAuditChanges(monthlyReportExportConfig, updated)).toEqual([
      expect.objectContaining({
        fieldName: "watermarkRules",
      }),
    ]);
  });
});
