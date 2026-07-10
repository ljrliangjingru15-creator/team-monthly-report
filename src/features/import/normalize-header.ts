import type { HeaderInput } from "./types";

export function normalizeHeader(value: HeaderInput) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, "")
    .replace(/[\p{P}\p{S}]/gu, "")
    .toLowerCase();
}

export function normalizeHeaderParts(...values: HeaderInput[]) {
  return normalizeHeader(values.filter((value) => value != null).join(""));
}
