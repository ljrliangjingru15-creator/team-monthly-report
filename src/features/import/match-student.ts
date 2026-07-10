import { normalizeText } from "./normalize-value";
import type { ParsedStudentCandidate } from "./types";

export type ExistingStudentForMatch = {
  id: string;
  season: string;
  name: string;
  counselor?: string | null;
  contractNumber?: string | null;
};

export type MatchResult<T> =
  | { status: "matched"; strategy: string; record: T }
  | { status: "ambiguous"; strategy: string; candidates: T[] }
  | { status: "new"; strategy: "none" };

function sameText(left: unknown, right: unknown) {
  const normalizedLeft = normalizeText(left)?.toLowerCase();
  const normalizedRight = normalizeText(right)?.toLowerCase();
  return !!normalizedLeft && !!normalizedRight && normalizedLeft === normalizedRight;
}

function resolveMatches<T>(strategy: string, candidates: T[]): MatchResult<T> | null {
  if (candidates.length === 1) {
    return { status: "matched", strategy, record: candidates[0] };
  }
  if (candidates.length > 1) {
    return { status: "ambiguous", strategy, candidates };
  }
  return null;
}

export function matchStudent(
  candidate: ParsedStudentCandidate["data"],
  existingStudents: ExistingStudentForMatch[],
): MatchResult<ExistingStudentForMatch> {
  if (candidate.systemId) {
    const systemMatches = existingStudents.filter(
      (student) => student.id === candidate.systemId,
    );
    const result = resolveMatches("system_id", systemMatches);
    if (result) return result;
  }

  if (candidate.contractNumber) {
    const contractMatches = existingStudents.filter((student) =>
      sameText(student.contractNumber, candidate.contractNumber),
    );
    const result = resolveMatches("contract_number", contractMatches);
    if (result) return result;
  }

  const identityMatches = existingStudents.filter(
    (student) =>
      sameText(student.name, candidate.name) &&
      sameText(student.counselor, candidate.counselor) &&
      sameText(student.season, candidate.season),
  );
  const result = resolveMatches("name_counselor_season", identityMatches);
  if (result) return result;

  return { status: "new", strategy: "none" };
}
