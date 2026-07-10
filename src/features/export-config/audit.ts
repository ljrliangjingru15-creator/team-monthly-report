import type { ExportConfigDefinition } from "./types";

const auditedFields: Array<keyof ExportConfigDefinition> = [
  "name",
  "description",
  "templateKey",
  "fieldRules",
  "templateRules",
  "styleRules",
  "watermarkRules",
  "redactionRules",
  "isDefault",
  "isActive",
];

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }
  return value;
}

export function buildExportConfigAuditChanges(
  before: ExportConfigDefinition,
  after: ExportConfigDefinition,
) {
  return auditedFields
    .map((fieldName) => ({
      fieldName,
      oldValue: JSON.stringify(sortJson(before[fieldName])),
      newValue: JSON.stringify(sortJson(after[fieldName])),
    }))
    .filter((change) => change.oldValue !== change.newValue);
}
