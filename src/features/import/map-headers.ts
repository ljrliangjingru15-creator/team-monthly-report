import { resolveHeaderAlias } from "./aliases";
import { collectSensitiveHeaders, detectSensitiveHeader } from "./sensitive-fields";
import { normalizeHeaderParts } from "./normalize-header";
import type { HeaderInput, HeaderMappingResult } from "./types";

type MapHeadersOptions = {
  groupHeaders?: HeaderInput[];
};

export function mapHeaders(
  headers: HeaderInput[],
  options: MapHeadersOptions = {},
): HeaderMappingResult {
  const fields: Record<string, number> = {};
  const duplicates: Record<string, number[]> = {};
  const unknown: HeaderMappingResult["unknown"] = [];
  const sensitiveMatches = collectSensitiveHeaders(headers);
  const ignoredSensitive = sensitiveMatches.map((match) => match.index);

  headers.forEach((header, index) => {
    if (detectSensitiveHeader(header)) return;

    const combinedHeader = normalizeHeaderParts(options.groupHeaders?.[index], header);
    const rawHeader = String(header ?? "");
    const target =
      resolveHeaderAlias(combinedHeader) ||
      resolveHeaderAlias(rawHeader) ||
      resolveHeaderAlias(String(options.groupHeaders?.[index] ?? ""));

    if (!target) {
      if (rawHeader.trim()) {
        unknown.push({ index, header: rawHeader });
      }
      return;
    }

    if (fields[target] != null) {
      duplicates[target] = [...(duplicates[target] ?? [fields[target] as number]), index];
      return;
    }

    fields[target] = index;
  });

  return {
    ...fields,
    fields,
    duplicates,
    unknown,
    ignoredSensitive,
    sensitiveMatches,
  };
}
