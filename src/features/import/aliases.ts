import { defaultImportConfigs } from "@/features/import-config/defaults";
import { normalizeHeader } from "./normalize-header";

const manualAliases: Record<string, string[]> = {
  name: ["学生", "学生姓名", "姓名", "studentname"],
  counselor: ["负责顾问", "后期顾问", "预计分配后期", "counselor"],
  deadline: ["ddl", "deadline", "截止日期", "申请截止日期"],
  schoolName: ["学校", "学校名称", "申请学校", "university", "college"],
  result: ["结果", "录取结果", "申请结果"],
};

export function buildHeaderAliasMap() {
  const entries = new Map<string, string>();

  for (const config of defaultImportConfigs) {
    for (const mapping of config.fieldMappings) {
      entries.set(normalizeHeader(mapping.target), mapping.target);
      for (const alias of mapping.aliases) {
        entries.set(normalizeHeader(alias), mapping.target);
      }
    }
  }

  for (const [target, aliases] of Object.entries(manualAliases)) {
    entries.set(normalizeHeader(target), target);
    for (const alias of aliases) {
      entries.set(normalizeHeader(alias), target);
    }
  }

  return entries;
}

export const headerAliasMap = buildHeaderAliasMap();

export function resolveHeaderAlias(header: string) {
  return headerAliasMap.get(normalizeHeader(header));
}
