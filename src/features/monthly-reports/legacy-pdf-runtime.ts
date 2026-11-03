import {
  extractSchoolApplicationRowsFromPdfItems,
  recoverLegacyOcrFieldLines,
  inferLegacyPdfIdentity,
  normalizeLegacyReportText,
  pdfTextItemsToLines,
  type LegacyPdfExtraction,
  type LegacyPdfTextItem,
} from "@/features/monthly-reports/legacy-pdf-report";

type LegacyPdfProgress = (message: string) => void;

type OcrWorker = {
  recognize: (image: HTMLCanvasElement) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
};

const OCR_SETUP_TIMEOUT_MS = 30_000;
const OCR_PAGE_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

async function createLocalOcrWorker(
  onProgress?: LegacyPdfProgress,
): Promise<OcrWorker> {
  const { createWorker } = await import("tesseract.js");
  let timedOut = false;
  const creation = createWorker("chi_sim", 1, {
    workerPath: "/tesseract/worker.min.js",
    corePath: "/tesseract/core",
    langPath: "/tesseract/lang",
    gzip: false,
    logger: (message) => {
      if (message.status === "loading tesseract core") {
        onProgress?.("正在加载本地 OCR 引擎...");
      } else if (message.status === "loading language traineddata") {
        onProgress?.("正在加载本地中文识别库...");
      }
    },
  }).then(async (worker) => {
    if (timedOut) {
      await worker.terminate().catch(() => undefined);
      throw new Error("OCR 初始化超时");
    }
    return worker as OcrWorker;
  });

  try {
    return await withTimeout(
      creation,
      OCR_SETUP_TIMEOUT_MS,
      "OCR 初始化超时",
    );
  } catch (error) {
    timedOut = true;
    throw error;
  }
}

export async function extractLegacyPdfReport(
  file: File,
  onProgress?: LegacyPdfProgress,
): Promise<LegacyPdfExtraction> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();
  const data = new Uint8Array(await file.arrayBuffer());
  const pdfDocument = await pdfjs.getDocument({ data }).promise;
  const metadata = await pdfDocument.getMetadata().catch(() => null);
  const info = (metadata?.info ?? {}) as Record<string, unknown>;
  const title = typeof info.Title === "string" ? info.Title : "";
  const author = typeof info.Author === "string" ? info.Author : "";
  const pageTexts: string[] = [];
  const schoolApplicationTables: string[][][] = [];
  let ocrWorker: OcrWorker | null = null;
  let usedOcr = false;
  let ocrWarning = "";
  let skipRemainingOcr = false;

  try {
    for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex += 1) {
      onProgress?.(
        `正在读取旧版 PDF 第 ${pageIndex}/${pdfDocument.numPages} 页...`,
      );
      const page = await pdfDocument.getPage(pageIndex);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.flatMap((item) => {
        if (!("str" in item) || !item.str.trim()) return [];
        return [
          {
            str: item.str,
            transform: item.transform.map(Number),
            width: Number(item.width),
          } satisfies LegacyPdfTextItem,
        ];
      });
      const pageText = pdfTextItemsToLines(textItems).join("\n");
      const schoolRows = extractSchoolApplicationRowsFromPdfItems(textItems);
      if (schoolRows) schoolApplicationTables.push(schoolRows);

      if (pageText.replace(/\s/g, "").length >= 80) {
        pageTexts.push(pageText);
        continue;
      }

      if (skipRemainingOcr) {
        pageTexts.push(pageText);
        continue;
      }

      onProgress?.(`第 ${pageIndex} 页是图片内容，正在本地识别文字...`);
      try {
        if (!ocrWorker) {
          ocrWorker = await createLocalOcrWorker(onProgress);
        }
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("无法创建 PDF 识别画布。");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const result = await withTimeout(
          ocrWorker.recognize(canvas),
          OCR_PAGE_TIMEOUT_MS,
          `第 ${pageIndex} 页 OCR 识别超时`,
        );
        const recognizedText = result.data.text.trim();
        usedOcr = Boolean(recognizedText) || usedOcr;
        pageTexts.push(recognizedText || pageText);
        canvas.remove();
      } catch (error) {
        ocrWarning =
          error instanceof Error ? error.message : "图片页 OCR 未完成";
        skipRemainingOcr = true;
        onProgress?.(
          `图片页识别未完成（${ocrWarning}），已继续使用 PDF 文本层回填。`,
        );
        await ocrWorker?.terminate().catch(() => undefined);
        ocrWorker = null;
        pageTexts.push(pageText);
      }
    }
  } finally {
    await ocrWorker?.terminate();
    await pdfDocument.destroy();
  }

  const extractedText = normalizeLegacyReportText(pageTexts.join("\n\n"));
  const recoveredFieldText = recoverLegacyOcrFieldLines(extractedText);
  const identity = inferLegacyPdfIdentity(
    file.name,
    title,
    author,
    extractedText,
  );
  const metadataLines = [
    identity.studentName ? `学生姓名：${identity.studentName}` : "",
    identity.season ? `申请季度：${identity.season}` : "",
    identity.applicationType ? `申请类型：${identity.applicationType}` : "",
    identity.reportDate ? `报告日期：${identity.reportDate}` : "",
    identity.reportTitle ? `报告标题：${identity.reportTitle}` : "",
    identity.departmentLabel ? `部门标签：${identity.departmentLabel}` : "",
  ].filter(Boolean);

  return {
    rawText: normalizeLegacyReportText(
      [...metadataLines, recoveredFieldText, extractedText].filter(Boolean).join("\n"),
    ),
    recoveredFieldText,
    title,
    author,
    identity,
    schoolApplicationTables,
    usedOcr,
    ocrWarning,
  };
}
