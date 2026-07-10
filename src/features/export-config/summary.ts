import type { ExportConfigDefinition } from "./types";

export function summarizeExportConfig(config: ExportConfigDefinition) {
  return {
    name: config.name,
    kind: config.kind,
    templateKey: config.templateKey,
    outputFormats: config.styleRules?.outputFormats ?? [],
    includedFields: config.fieldRules.include.length,
    hiddenFields: config.redactionRules.alwaysHide,
    audience: config.redactionRules.audience,
    watermarkEnabled: Boolean(config.watermarkRules?.enabled),
  };
}

export function findDefaultExportConfig(
  configs: readonly ExportConfigDefinition[],
  kind: ExportConfigDefinition["kind"],
) {
  return configs.find((config) => config.kind === kind && config.isDefault && config.isActive);
}
