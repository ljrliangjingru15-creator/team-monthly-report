import type { PosterDraft, PosterExportFormat } from "./types";

export function buildPosterExportPlan(
  poster: PosterDraft,
  formats: PosterExportFormat[],
) {
  if (!poster.previewedAt) {
    return {
      status: "blocked" as const,
      reason: "preview_required" as const,
      operations: [],
    };
  }

  return {
    status: "ready" as const,
    operations: formats.map((format) => ({
      type: "export_poster" as const,
      posterId: poster.id,
      format,
      fileName: `${poster.studentName}-${poster.schoolName}-录取喜报.${format.toLowerCase()}`,
    })),
  };
}
