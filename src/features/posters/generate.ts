import { admissionPosterExportConfig } from "@/features/export-config/defaults";
import type { AdmissionResultRecord } from "@/features/admissions/types";
import type { PosterDraft } from "./types";

export function generatePosterDraft(admission: AdmissionResultRecord): PosterDraft {
  if (!admission.canGeneratePoster) {
    throw new Error("该录取结果不可生成喜报");
  }

  return {
    id: `poster:${admission.id}`,
    admissionResultId: admission.id,
    studentName: admission.studentName,
    schoolName: admission.schoolName,
    result: admission.result,
    counselor: admission.counselor,
    title: `${admission.studentName} 收获 ${admission.schoolName} 录取`,
    background:
      admission.posterBackground ??
      admission.backgroundSummary ??
      "学生背景待补充，可在导出前编辑确认。",
    templateKey: admissionPosterExportConfig.templateKey,
    watermark: admissionPosterExportConfig.watermarkRules?.enabled
      ? admissionPosterExportConfig.watermarkRules.text
      : undefined,
    source: admission,
  };
}
