import type { ImportConfigDefinition } from "./types";

const auditedFields: Array<keyof ImportConfigDefinition> = [
  "name",
  "description",
  "sheetRules",
  "headerRules",
  "fieldMappings",
  "skippedFields",
  "sensitiveRules",
  "studentMatchRules",
  "applicationMatchRules",
  "conflictRules",
  "isDefault",
  "isActive",
];

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortJson(nestedValue)]),
    );
  }

  return value;
}

function stableStringify(value: unknown) {
  return JSON.stringify(sortJson(value));
}

export function buildImportConfigAuditChanges(
  before: ImportConfigDefinition,
  after: ImportConfigDefinition,
) {
  return auditedFields
    .map((fieldName) => ({
      fieldName,
      oldValue: stableStringify(before[fieldName]),
      newValue: stableStringify(after[fieldName]),
    }))
    .filter((change) => change.oldValue !== change.newValue);
}
