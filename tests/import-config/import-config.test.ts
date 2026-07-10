import { describe, expect, it } from "vitest";
import { buildImportConfigAuditChanges } from "@/features/import-config/audit";
import {
  counselorProgressDefaultConfig,
  defaultImportConfigs,
  studentMasterDefaultConfig,
} from "@/features/import-config/defaults";
import {
  assertCanEditImportConfig,
  assertCanViewImportConfig,
} from "@/features/import-config/permissions";
import { validateImportConfig } from "@/features/import-config/schema";
import {
  findDefaultImportConfig,
  summarizeImportConfig,
} from "@/features/import-config/summary";
import type { Actor } from "@/features/permissions/types";

const admin: Actor = { id: "admin", name: "管理员", role: "ADMIN" };
const leader: Actor = {
  id: "leader",
  name: "组长",
  roleAssignments: [{ role: "LEADER" }, { role: "COUNSELOR" }],
};
const counselor: Actor = { id: "counselor", name: "顾问", role: "COUNSELOR" };

describe("default import configs", () => {
  it("provides valid master and counselor progress defaults", () => {
    expect(defaultImportConfigs.map((config) => config.importType)).toEqual([
      "STUDENT_MASTER",
      "COUNSELOR_PROGRESS",
    ]);

    for (const config of defaultImportConfigs) {
      expect(validateImportConfig(config)).toMatchObject({
        name: config.name,
        importType: config.importType,
      });
    }
  });

  it("uses 2026申请 as the default master sheet", () => {
    expect(studentMasterDefaultConfig.sheetRules).toEqual({
      mode: "fixed",
      sheetName: "2026申请",
    });
    expect(studentMasterDefaultConfig.headerRules.headerRow).toBe(3);
    expect(
      findDefaultImportConfig(defaultImportConfigs, "STUDENT_MASTER"),
    ).toBe(studentMasterDefaultConfig);
  });

  it("supports multi-sheet counselor workbooks including special sheets", () => {
    expect(counselorProgressDefaultConfig.sheetRules).toMatchObject({
      mode: "multi_sheet",
      includeHiddenSheets: false,
      specialSheetStrategy: "parse_when_possible_otherwise_review",
    });
    expect(
      findDefaultImportConfig(defaultImportConfigs, "COUNSELOR_PROGRESS"),
    ).toBe(counselorProgressDefaultConfig);
  });

  it("keeps contract amount and email mapped while dropping phones and passwords", () => {
    const masterTargets = studentMasterDefaultConfig.fieldMappings.map(
      (mapping) => mapping.target,
    );
    const counselorTargets = counselorProgressDefaultConfig.fieldMappings.map(
      (mapping) => mapping.target,
    );

    expect(masterTargets).toContain("contractAmount");
    expect(counselorTargets).toContain("email");
    expect(counselorProgressDefaultConfig.skippedFields).toEqual(
      expect.arrayContaining(["学生电话", "家长电话", "密码"]),
    );
    expect(
      counselorProgressDefaultConfig.sensitiveRules.map((rule) => rule.category),
    ).toEqual(
      expect.arrayContaining(["password", "accountCredential", "phone"]),
    );
  });

  it("summarizes configs for the settings page", () => {
    expect(summarizeImportConfig(studentMasterDefaultConfig)).toMatchObject({
      name: "总表默认配置",
      sheetLabel: "2026申请",
      conflictPolicy: "manual_confirm",
    });
  });
});

describe("import config permissions and audit", () => {
  it("allows admins to edit, leaders to view and counselors to do neither", () => {
    expect(() => assertCanEditImportConfig(admin)).not.toThrow();
    expect(() => assertCanViewImportConfig(admin)).not.toThrow();
    expect(() => assertCanViewImportConfig(leader)).not.toThrow();
    expect(() => assertCanEditImportConfig(leader)).toThrow("无权修改");
    expect(() => assertCanViewImportConfig(counselor)).toThrow("无权查看");
  });

  it("builds audit changes when import config rules are edited", () => {
    const updated = {
      ...studentMasterDefaultConfig,
      sheetRules: { mode: "fixed" as const, sheetName: "2027申请" },
    };

    expect(buildImportConfigAuditChanges(studentMasterDefaultConfig, updated)).toEqual([
      expect.objectContaining({
        fieldName: "sheetRules",
        oldValue: JSON.stringify({ mode: "fixed", sheetName: "2026申请" }),
        newValue: JSON.stringify({ mode: "fixed", sheetName: "2027申请" }),
      }),
    ]);
  });
});
