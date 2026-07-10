import { normalizeSchoolName, normalizeText } from "./normalize-value";
import type { ParsedApplicationCandidate } from "./types";

export type ExistingApplicationForMatch = {
  id: string;
  studentId: string;
  schoolName?: string | null;
  schoolNameCn?: string | null;
  schoolNameEn?: string | null;
  major?: string | null;
  program?: string | null;
  round?: string | null;
};

export type ApplicationMatchResult =
  | { status: "matched"; strategy: "student_school_major_round"; record: ExistingApplicationForMatch }
  | {
      status: "ambiguous";
      strategy: "student_school_major_round";
      candidates: ExistingApplicationForMatch[];
    }
  | { status: "new"; strategy: "none" }
  | { status: "manual_review"; strategy: "missing_match_fields"; missingFields: string[] };

function norm(value: unknown) {
  return normalizeText(value)?.toLowerCase();
}

function schoolMatches(application: ExistingApplicationForMatch, schoolName: string) {
  const normalizedCandidate = norm(normalizeSchoolName(schoolName));
  return [application.schoolName, application.schoolNameCn, application.schoolNameEn]
    .map((value) => norm(normalizeSchoolName(value)))
    .some((value) => !!value && value === normalizedCandidate);
}

function majorMatches(application: ExistingApplicationForMatch, major?: string) {
  if (!major) return true;
  const normalizedCandidate = norm(major);
  return [application.major, application.program]
    .map(norm)
    .some((value) => !!value && value === normalizedCandidate);
}

function roundMatches(application: ExistingApplicationForMatch, round?: string) {
  if (!round) return true;
  return norm(application.round) === norm(round);
}

export function matchApplication(
  candidate: ParsedApplicationCandidate["data"] & { studentId?: string },
  existingApplications: ExistingApplicationForMatch[],
): ApplicationMatchResult {
  const missingFields = [
    !candidate.studentId ? "studentId" : null,
    !candidate.schoolName ? "schoolName" : null,
  ].filter((field): field is string => field != null);

  if (missingFields.length > 0) {
    return { status: "manual_review", strategy: "missing_match_fields", missingFields };
  }

  const matches = existingApplications.filter(
    (application) =>
      application.studentId === candidate.studentId &&
      schoolMatches(application, candidate.schoolName) &&
      majorMatches(application, candidate.major) &&
      roundMatches(application, candidate.round),
  );

  if (matches.length === 1) {
    return {
      status: "matched",
      strategy: "student_school_major_round",
      record: matches[0],
    };
  }

  if (matches.length > 1) {
    return {
      status: "ambiguous",
      strategy: "student_school_major_round",
      candidates: matches,
    };
  }

  return { status: "new", strategy: "none" };
}
