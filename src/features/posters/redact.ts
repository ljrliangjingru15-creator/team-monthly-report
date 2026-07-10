import type { PosterDraft } from "./types";

const forbiddenPatterns = [
  /合同金额[:：]?\s*\d+/g,
  /账号[:：]?\S+/g,
  /密码[:：]?\S+/g,
  /电话[:：]?\S+/g,
  /内部交接[:：]?.*/g,
  /交接处理[:：]?.*/g,
];

function redactText(value: string | null | undefined) {
  if (!value) return value;
  return forbiddenPatterns.reduce(
    (text, pattern) => text.replace(pattern, "[已隐藏]"),
    value,
  );
}

export function buildExternalPosterPreview(poster: PosterDraft) {
  return {
    ...poster,
    background: redactText(poster.background) ?? "",
    source: {
      id: poster.source.id,
      studentName: poster.source.studentName,
      schoolName: poster.source.schoolName,
      result: poster.source.result,
      counselor: poster.source.counselor,
    },
    previewedAt: poster.previewedAt ?? new Date(0),
  };
}

export function containsForbiddenPosterContent(poster: unknown) {
  return /合同金额|账号|密码|电话|内部交接|交接处理/.test(JSON.stringify(poster));
}
