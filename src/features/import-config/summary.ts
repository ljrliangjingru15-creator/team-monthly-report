import type { ImportConfigDefinition } from "./types";

export function summarizeImportConfig(config: ImportConfigDefinition) {
  const requiredFields = config.fieldMappings
    .filter((mapping) => mapping.required)
    .map((mapping) => mapping.target);

  return {
    name: config.name,
    importType: config.importType,
    sheetMode: config.sheetRules.mode,
    sheetLabel:
      config.sheetRules.mode === "fixed"
        ? config.sheetRules.sheetName
        : "多学生 Sheet + 特殊 Sheet 兼容",
    headerRow: config.headerRules.headerRow,
    mappingCount: config.fieldMappings.length,
    requiredFields,
    sensitiveCategories: config.sensitiveRules.map((rule) => rule.category),
    conflictPolicy: config.conflictRules.defaultAction,
  };
}

export function findDefaultImportConfig(
  configs: readonly ImportConfigDefinition[],
  importType: ImportConfigDefinition["importType"],
) {
  return configs.find(
    (config) =>
      config.importType === importType && config.isDefault && config.isActive,
  );
}
