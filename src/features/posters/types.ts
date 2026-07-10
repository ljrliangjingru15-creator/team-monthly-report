import type { AdmissionResultRecord } from "@/features/admissions/types";

export type PosterDraft = {
  id: string;
  admissionResultId: string;
  studentName: string;
  schoolName: string;
  result: string;
  counselor?: string | null;
  title: string;
  background: string;
  templateKey: string;
  watermark?: string;
  previewedAt?: Date;
  exportedAt?: Date;
  source: AdmissionResultRecord;
};

export type PosterExportFormat = "PNG" | "PDF";
