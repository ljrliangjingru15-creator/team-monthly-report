import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

const models = Prisma.dmmf.datamodel.models;

function model(name: string) {
  const found = models.find((item) => item.name === name);
  if (!found) throw new Error(`Missing Prisma model: ${name}`);
  return found;
}

function fieldNames(modelName: string) {
  return model(modelName).fields.map((field) => field.name);
}

describe("modular application management schema", () => {
  it("contains the first-batch business models", () => {
    expect(models.map((item) => item.name)).toEqual(
      expect.arrayContaining([
        "User",
        "UserRole",
        "Student",
        "Application",
        "SchoolFinalization",
        "HandoffIssue",
        "ImportConfig",
        "ImportBatch",
        "ImportIssue",
        "AdmissionResult",
        "MonthlyReport",
        "Poster",
        "ExperienceCase",
        "ExportConfig",
        "ExportLog",
        "FileAsset",
        "ChangeLog",
      ]),
    );
  });

  it("keeps required commercial and email fields on Student", () => {
    expect(fieldNames("Student")).toEqual(
      expect.arrayContaining([
        "contractNumber",
        "contractType",
        "contractAmount",
        "contractAmountNotes",
        "email",
        "counselorUserId",
        "handoffStatus",
      ]),
    );
  });

  it("does not create structured phone or password fields", () => {
    const forbidden = /(phone|mobile|tel|电话|password|密码|accountPassword|portalPassword)/i;
    const allFields = models.flatMap((item) =>
      item.fields.map((field) => `${item.name}.${field.name}`),
    );

    expect(
      allFields.filter(
        (name) => forbidden.test(name) && name !== "User.passwordHash",
      ),
    ).toEqual([]);
  });

  it("supports additive leader and counselor roles", () => {
    expect(fieldNames("User")).toContain("roleAssignments");
    expect(fieldNames("UserRole")).toEqual(
      expect.arrayContaining(["userId", "role", "scope"]),
    );
  });

  it("stores import and export rules as configurable JSON", () => {
    expect(fieldNames("ImportConfig")).toEqual(
      expect.arrayContaining([
        "sheetRules",
        "headerRules",
        "fieldMappings",
        "sensitiveRules",
        "studentMatchRules",
        "conflictRules",
      ]),
    );
    expect(fieldNames("ExportConfig")).toEqual(
      expect.arrayContaining([
        "fieldRules",
        "templateRules",
        "styleRules",
        "watermarkRules",
        "redactionRules",
      ]),
    );
  });
});
