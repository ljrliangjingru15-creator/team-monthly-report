import {
  extractSchoolApplicationRowsFromPdfItems,
  recoverLegacyOcrFieldLines,
  inferLegacyPdfIdentity,
  normalizeLegacyReportText,
  pdfTextItemsToLines,
  type LegacyPdfExtraction,
  type LegacyImageReportAnalysis,
  type LegacyPdfTextItem,
} from "@/features/monthly-reports/legacy-pdf-report";

type LegacyPdfProgress = (message: string) => void;

type OcrWorker = {
  recognize: (
    image: HTMLCanvasElement,
    options?: Record<string, unknown>,
    output?: Record<string, boolean>,
  ) => Promise<{ data: { text: string; tsv?: string | null } }>;
  terminate: () => Promise<unknown>;
};

type OcrWord = {
  block: number;
  confidence: number;
  height: number;
  left: number;
  line: number;
  paragraph: number;
  text: string;
  top: number;
  width: number;
};

type OcrLine = {
  bottom: number;
  height: number;
  left: number;
  text: string;
  top: number;
  width: number;
  words: OcrWord[];
};

const OCR_SETUP_TIMEOUT_MS = 30_000;
const OCR_PAGE_TIMEOUT_MS = 45_000;
const OCR_IMAGE_MAX_PIXELS = 12_000_000;
const OCR_IMAGE_TARGET_WIDTH = 1_800;

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

function buildLegacyExtraction(
  file: File,
  extractedSourceText: string,
  options: {
    author?: string;
    title?: string;
    schoolApplicationTables?: string[][][];
    usedOcr?: boolean;
    ocrWarning?: string;
    imageAnalysis?: LegacyImageReportAnalysis;
  } = {},
): LegacyPdfExtraction {
  const extractedText = normalizeLegacyReportText(extractedSourceText);
  const recoveredFieldText = recoverLegacyOcrFieldLines(extractedText);
  const title = options.title ?? "";
  const author = options.author ?? "";
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
      [...metadataLines, recoveredFieldText, extractedText]
        .filter(Boolean)
        .join("\n"),
    ),
    recoveredFieldText,
    title,
    author,
    identity,
    schoolApplicationTables: options.schoolApplicationTables ?? [],
    usedOcr: options.usedOcr ?? false,
    ocrWarning: options.ocrWarning ?? "",
    imageAnalysis: options.imageAnalysis,
  };
}

function parseOcrTsvLines(tsv: string | null | undefined) {
  if (!tsv) return [];
  const words: OcrWord[] = [];
  for (const row of tsv.split(/\r?\n/).slice(1)) {
    const fields = row.split("\t");
    if (fields.length < 12 || fields[0] !== "5") continue;
    const text = fields.slice(11).join("\t").trim();
    const confidence = Number(fields[10]);
    if (!text || !Number.isFinite(confidence) || confidence < 0) continue;
    words.push({
      block: Number(fields[2]),
      paragraph: Number(fields[3]),
      line: Number(fields[4]),
      left: Number(fields[6]),
      top: Number(fields[7]),
      width: Number(fields[8]),
      height: Number(fields[9]),
      confidence,
      text,
    });
  }

  return buildOcrLines(words);
}

function buildOcrLines(words: OcrWord[]) {
  const grouped = new Map<string, OcrWord[]>();
  for (const word of words) {
    const key = `${word.block}-${word.paragraph}-${word.line}`;
    const lineWords = grouped.get(key) ?? [];
    lineWords.push(word);
    grouped.set(key, lineWords);
  }

  return Array.from(grouped.values())
    .map((lineWords): OcrLine => {
      const sortedWords = [...lineWords].sort((left, right) => left.left - right.left);
      const left = Math.min(...sortedWords.map((word) => word.left));
      const top = Math.min(...sortedWords.map((word) => word.top));
      const right = Math.max(...sortedWords.map((word) => word.left + word.width));
      const bottom = Math.max(...sortedWords.map((word) => word.top + word.height));
      return {
        bottom,
        height: bottom - top,
        left,
        text: sortedWords.map((word) => word.text).join(" ").trim(),
        top,
        width: right - left,
        words: sortedWords,
      };
    })
    .sort((left, right) => left.top - right.top || left.left - right.left);
}

function compactOcrText(value: string) {
  return value.normalize("NFKC").replace(/[\s:：|｜·•._-]+/g, "");
}

function detectImageSection(line: string) {
  const compact = compactOcrText(line);
  if (!compact) return null;
  if (compact.includes("当前阶段重点和下一步建议")) return "stageFocus";
  if (compact.includes("关键摘要")) return "summary";
  if (compact.includes("申请时间轴")) return "timeline";
  if (compact.includes("基础信息")) return "basicInfo";
  if (compact.includes("材料收集")) return "materialCollection";
  if (compact.includes("院校申请")) return "schoolApplications";
  if (
    /^阶段性反馈$/.test(compact) ||
    /^本次阶段性进度$/.test(compact) ||
    /\d{1,2}月已完成(?:的)?申请工作/.test(compact)
  ) {
    return "completedThisMonth";
  }
  if (compact.includes("下一阶段计划") || compact === "下月计划") {
    return "nextMonthPlan";
  }
  if (compact.includes("需要学生/家庭配合") || compact.includes("学生/家庭待办")) {
    return "clientTasks";
  }
  if (compact === "附件" || compact === "附件展示") return "attachments";
  return null;
}

const canonicalImageSectionHeading: Record<string, string> = {
  stageFocus: "当前阶段重点和下一步建议",
  summary: "关键摘要",
  timeline: "申请时间轴",
  basicInfo: "基础信息",
  materialCollection: "材料收集",
  schoolApplications: "院校申请",
  completedThisMonth: "阶段性反馈",
  nextMonthPlan: "下一阶段计划",
  clientTasks: "需要学生/家庭配合",
  attachments: "附件",
};

function extractImageSectionContent(lines: OcrLine[], section: string) {
  const startIndex = lines.findIndex((line) => detectImageSection(line.text) === section);
  if (startIndex < 0) return "";
  const body: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (detectImageSection(lines[index].text)) break;
    body.push(lines[index].text.trim());
  }
  const cleanedLines = body
    .filter((line) => {
      const compact = compactOcrText(line);
      return (
        compact.length > 2 &&
        !/^[图袍羡中本呈、，。]+$/.test(compact) &&
        compact !== "羡申请"
      );
    })
    .map((line) => line.trim());

  if (section === "nextMonthPlan") {
    const systemLineIndex = cleanedLines.findIndex((line) =>
      /UC\s*申\s*请\s*系\s*统/i.test(line),
    );
    if (systemLineIndex >= 0) {
      cleanedLines[systemLineIndex] = "2. 填写 UC 申请系统";
      const fragmentIndex = cleanedLines.findIndex(
        (line, index) => index !== systemLineIndex && compactOcrText(line) === "填写多",
      );
      if (fragmentIndex >= 0) cleanedLines.splice(fragmentIndex, 1);
    }
  }

  return cleanedLines.join("\n").trim();
}

function canonicalizeTimelineLabel(value: string) {
  const compact = compactOcrText(value).replace(/UCC/gi, "UC");
  if (/UC.*申请准备/i.test(compact)) return "UC申请准备";
  if (/UC.*申请提交/i.test(compact)) return "UC申请提交";
  if (compact.includes("早申请准备")) return "早申请准备";
  if (compact.includes("早申请提交")) return "早申请提交";
  if (compact.includes("常规申请准备")) return "常规申请准备";
  if (compact.includes("常规申请提交")) return "常规申请提交";
  if (compact.includes("申请状态跟进")) return "申请状态跟进";
  return value.trim();
}

function detectHorizontalTableRules(
  canvas: HTMLCanvasElement,
  xStart: number,
  xEnd: number,
  yStart: number,
) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];
  const width = Math.max(1, xEnd - xStart);
  const height = Math.max(1, canvas.height - yStart);
  const pixels = context.getImageData(xStart, yStart, width, height).data;
  const candidateRows: number[] = [];
  const sampleStep = Math.max(2, Math.round(width / 420));

  for (let y = 0; y < height; y += 1) {
    let borderPixels = 0;
    let samples = 0;
    for (let x = 0; x < width; x += sampleStep) {
      const offset = (y * width + x) * 4;
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const maximum = Math.max(red, green, blue);
      const minimum = Math.min(red, green, blue);
      samples += 1;
      if (
        minimum >= 185 &&
        maximum <= 254 &&
        maximum - minimum <= 50 &&
        (red + green + blue) / 3 < 252
      ) {
        borderPixels += 1;
      }
    }
    if (samples > 0 && borderPixels / samples >= 0.42) {
      candidateRows.push(y + yStart);
    }
  }

  const rules: number[] = [];
  for (const row of candidateRows) {
    const previous = rules.at(-1);
    if (previous === undefined || row - previous > 3) rules.push(row);
    else rules[rules.length - 1] = Math.round((previous + row) / 2);
  }
  return rules;
}

function joinTableCellWords(words: OcrWord[]) {
  const grouped = new Map<string, OcrWord[]>();
  for (const word of words) {
    const key = `${word.block}-${word.paragraph}-${word.line}`;
    const lineWords = grouped.get(key) ?? [];
    lineWords.push(word);
    grouped.set(key, lineWords);
  }
  return Array.from(grouped.values())
    .sort((left, right) => Math.min(...left.map((word) => word.top)) - Math.min(...right.map((word) => word.top)))
    .map((lineWords) =>
      lineWords
        .sort((left, right) => left.left - right.left)
        .map((word) => word.text)
        .join(" ")
        .trim(),
    )
    .filter(Boolean)
    .join(" ")
    .trim();
}

function normalizeSchoolApplicationCell(value: string, columnIndex: number) {
  let normalized = value
    .replace(/^[“”"'。·-]+/, "")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
  if (columnIndex >= 5 && /^[1lI|/\s]+$/.test(normalized)) return "/";
  if (columnIndex === 3) normalized = normalized.replace(/^[^A-Za-z]+/, "");
  if (columnIndex === 4) {
    normalized = normalized
      .replace(/^(\d{4})\.(\d{2})(\d{2})$/, "$1.$2.$3")
      .replace(/^(\d{4})(\d{2})(\d{1,2})$/, "$1.$2.$3");
  }
  if (columnIndex === 0) {
    normalized = normalized
      .replace(/^UCIvine\b/i, "UC Irvine")
      .replace(/^UTAustin\b/i, "UT Austin")
      .replace(/^UNC Chapel Hi\s*证?$/i, "UNC Chapel Hill");
  }
  return normalized;
}

function extractSchoolApplicationTableFromImage(
  canvas: HTMLCanvasElement,
  lines: OcrLine[],
) {
  const heading = lines.find(
    (line) => detectImageSection(line.text) === "schoolApplications",
  );
  if (!heading) return null;
  const xStart = Math.round(canvas.width * 0.37);
  const xEnd = Math.round(canvas.width * 0.965);
  const rules = detectHorizontalTableRules(
    canvas,
    xStart,
    xEnd,
    Math.max(0, Math.round(heading.bottom + canvas.height * 0.004)),
  );
  if (rules.length < 3) return null;

  const allWords = lines.flatMap((line) => line.words);
  const headers = [
    "申请大学英文名称",
    "申请学院",
    "专业",
    "申请轮次",
    "申请截止时间",
    "材料是否齐全",
    "录取结果",
    "录取专业和学院",
  ];
  const rows: string[][] = [];
  const columnWidth = (xEnd - xStart) / headers.length;

  for (let index = 0; index < rules.length - 1; index += 1) {
    const top = rules[index];
    const bottom = rules[index + 1];
    if (bottom - top < 8) continue;
    const rowWords = allWords.filter((word) => {
      const centerX = word.left + word.width / 2;
      const centerY = word.top + word.height / 2;
      return centerX >= xStart && centerX <= xEnd && centerY > top && centerY < bottom;
    });
    if (!rowWords.length) continue;
    const cells = headers.map((_, columnIndex) =>
      normalizeSchoolApplicationCell(joinTableCellWords(
        rowWords.filter((word) => {
          const centerX = word.left + word.width / 2;
          const wordColumn = Math.max(
            0,
            Math.min(headers.length - 1, Math.floor((centerX - xStart) / columnWidth)),
          );
          return wordColumn === columnIndex;
        }),
      ), columnIndex),
    );
    if (cells[0]) {
      for (let statusColumn = 5; statusColumn <= 7; statusColumn += 1) {
        if (!cells[statusColumn]) cells[statusColumn] = "/";
      }
    }
    const compactRow = compactOcrText(cells.join(" "));
    if (
      cells.some(Boolean) &&
      !compactRow.includes("申请大学英文名称") &&
      !compactRow.includes("申请学院专业申请轮次")
    ) {
      rows.push(cells);
    }
  }

  return rows.length ? [headers, ...rows] : null;
}

function analyzeStructuredReportImage(
  canvas: HTMLCanvasElement,
  recognizedText: string,
  tsv: string | null | undefined,
) {
  const lines = parseOcrTsvLines(tsv);
  if (!lines.length) return null;
  const compactText = compactOcrText(recognizedText);
  const isReportImage =
    compactText.includes("阶段性反馈报告") ||
    lines.some((line) => detectImageSection(line.text) === "timeline");
  if (!isReportImage) return null;

  const headerCutoff = canvas.height * 0.125;
  const leftBoundary = canvas.width * 0.37;
  const words = lines.flatMap((line) => line.words);
  const headerLines = buildOcrLines(
    words.filter((word) => word.top < headerCutoff),
  );
  const leftLines = buildOcrLines(
    words.filter(
      (word) =>
        word.top >= headerCutoff && word.left + word.width / 2 < leftBoundary,
    ),
  );
  const rightLines = buildOcrLines(
    words.filter(
      (word) =>
        word.top >= headerCutoff && word.left + word.width / 2 >= leftBoundary,
    ),
  );
  const detectedSections = Array.from(
    new Set(lines.map((line) => detectImageSection(line.text)).filter(Boolean)),
  ) as string[];
  const compactSections = Array.from(
    new Set(leftLines.map((line) => detectImageSection(line.text)).filter(Boolean)),
  ) as string[];
  const sectionTitles: LegacyImageReportAnalysis["sectionTitles"] = {};
  for (const line of lines) {
    const section = detectImageSection(line.text);
    if (section === "completedThisMonth") {
      const monthTitle = compactOcrText(line.text).match(
        /(\d{1,2}月已完成(?:的)?申请工作)/,
      )?.[1];
      sectionTitles.completedThisMonth = monthTitle || "阶段性反馈";
    }
    if (section === "nextMonthPlan") sectionTitles.nextMonthPlan = "下一阶段计划";
    if (section === "clientTasks") sectionTitles.clientTasks = "需要学生/家庭配合";
  }
  const sectionContent: LegacyImageReportAnalysis["sectionContent"] = {
    completedThisMonth: extractImageSectionContent(leftLines, "completedThisMonth") ||
      extractImageSectionContent(rightLines, "completedThisMonth"),
    nextMonthPlan: extractImageSectionContent(leftLines, "nextMonthPlan") ||
      extractImageSectionContent(rightLines, "nextMonthPlan"),
    clientTasks: extractImageSectionContent(rightLines, "clientTasks") ||
      extractImageSectionContent(leftLines, "clientTasks"),
  };
  const currentTimelineLine = leftLines.find((line) =>
    /进行中|当前/.test(compactOcrText(line.text)),
  );
  const currentTimelineLabel = currentTimelineLine
    ? canonicalizeTimelineLabel(
        compactOcrText(currentTimelineLine.text)
          .replace(/(?:进行中|当前).*$/, "")
          .replace(/^[^\p{L}\p{N}]+/u, "")
          .trim(),
      )
    : "";

  const logicalText = [
    ...headerLines.map((line) => line.text),
    ...leftLines.map((line) => {
      const section = detectImageSection(line.text);
      return section ? canonicalImageSectionHeading[section] : line.text;
    }),
    ...rightLines.map((line) => {
      const section = detectImageSection(line.text);
      return section ? canonicalImageSectionHeading[section] : line.text;
    }),
  ].join("\n");
  const schoolTable = extractSchoolApplicationTableFromImage(canvas, lines);

  return {
    logicalText,
    schoolApplicationTables: schoolTable ? [schoolTable] : [],
    imageAnalysis: {
      compactSections,
      currentTimelineLabel,
      detectedSections,
      sectionContent,
      sectionTitles,
    } satisfies LegacyImageReportAnalysis,
  };
}

async function loadImageFileToCanvas(file: File) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("无法读取图片内容"));
    });

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    if (!sourceWidth || !sourceHeight) throw new Error("图片尺寸无效");

    const clarityScale = Math.max(1, OCR_IMAGE_TARGET_WIDTH / sourceWidth);
    const pixelLimitScale = Math.sqrt(
      OCR_IMAGE_MAX_PIXELS / (sourceWidth * sourceHeight),
    );
    const scale = Math.min(2, clarityScale, pixelLimitScale);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("无法创建图片识别画布");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function extractLegacyImageReport(
  file: File,
  onProgress?: LegacyPdfProgress,
): Promise<LegacyPdfExtraction> {
  onProgress?.("正在读取历史报告图片...");
  const canvas = await loadImageFileToCanvas(file);
  let worker: OcrWorker | null = null;
  try {
    worker = await createLocalOcrWorker(onProgress);
    onProgress?.("正在识别图片中的报告标题、基础信息和阶段内容...");
    const result = await withTimeout(
      worker.recognize(canvas, {}, { text: true, tsv: true }),
      OCR_PAGE_TIMEOUT_MS,
      "历史报告图片 OCR 识别超时",
    );
    const recognizedText = result.data.text.trim();
    if (!recognizedText) throw new Error("图片中未识别到可回填文字");
    onProgress?.("正在按报告版面恢复时间轴、模块和院校表格...");
    const layout = analyzeStructuredReportImage(
      canvas,
      recognizedText,
      result.data.tsv,
    );
    return buildLegacyExtraction(file, layout?.logicalText || recognizedText, {
      usedOcr: true,
      schoolApplicationTables: layout?.schoolApplicationTables,
      imageAnalysis: layout?.imageAnalysis,
    });
  } finally {
    canvas.remove();
    await worker?.terminate().catch(() => undefined);
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

  return buildLegacyExtraction(file, pageTexts.join("\n\n"), {
    author,
    title,
    schoolApplicationTables,
    usedOcr,
    ocrWarning,
  });
}
