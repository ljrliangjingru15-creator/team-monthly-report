import * as XLSX from "xlsx";

const roundAliases = new Map<string, string>([
  ["earlydecision", "ED"],
  ["ed", "ED"],
  ["earlyaction", "EA"],
  ["ea", "EA"],
  ["regular", "RD"],
  ["regulardecision", "RD"],
  ["rd", "RD"],
  ["rolling", "Rolling"],
]);

const resultAliases = new Map<string, string>([
  ["录取", "录取"],
  ["admit", "录取"],
  ["admitted", "录取"],
  ["accepted", "录取"],
  ["拒绝", "拒绝"],
  ["reject", "拒绝"],
  ["rejected", "拒绝"],
  ["waitlist", "waitlist"],
  ["wl", "waitlist"],
  ["defer", "defer"],
  ["deferred", "defer"],
]);

function compact(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

function key(value: string) {
  return compact(value).replace(/[\s_\-./]/g, "").toLowerCase();
}

export function normalizeText(value: unknown) {
  if (value == null) return undefined;
  const text = compact(String(value));
  return text.length > 0 ? text : undefined;
}

export function normalizeNumber(value: unknown) {
  if (value == null || value === "") return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const numeric = Number(String(value).replace(/[,，¥￥$]/g, "").trim());
  return Number.isFinite(numeric) ? numeric : undefined;
}

export function normalizeDate(value: unknown) {
  if (value == null || value === "") return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return undefined;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }

  const text = normalizeText(value);
  if (!text) return undefined;

  const normalized = text
    .replace(/[年月.]/g, "-")
    .replace(/[日号]/g, "")
    .replace(/\//g, "-");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function normalizeRound(value: unknown) {
  const text = normalizeText(value);
  if (!text) return undefined;
  return roundAliases.get(key(text)) ?? text;
}

export function normalizeResult(value: unknown) {
  const text = normalizeText(value);
  if (!text) return undefined;
  return resultAliases.get(key(text)) ?? text;
}

export function normalizeSchoolName(value: unknown) {
  const text = normalizeText(value);
  if (!text) return undefined;

  return text
    .replace(/\s+/g, " ")
    .replace(/\s*\(.*?\)\s*$/g, "")
    .trim();
}

export function normalizeStatus(value: unknown) {
  return normalizeText(value);
}
