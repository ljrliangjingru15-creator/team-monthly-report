import {
  APPLICATION_TYPE_OPTIONS,
  type MonthlyReportApplicationType,
} from "@/features/monthly-reports/application-types";

export type LegacyPdfTextItem = {
  str: string;
  transform: number[];
  width: number;
};

export type LegacyPdfIdentity = {
  studentName: string;
  applicationType: MonthlyReportApplicationType | null;
  season: string;
  reportDate: string;
  reportTitle: string;
  departmentLabel: string;
};

export type LegacyPdfExtraction = {
  rawText: string;
  recoveredFieldText: string;
  title: string;
  author: string;
  identity: LegacyPdfIdentity;
  schoolApplicationTables: string[][][];
  usedOcr: boolean;
  ocrWarning: string;
};

const legacyOcrFieldSpecs = [
  { label: "就读年级", aliases: ["就读年级"] },
  { label: "就读学校", aliases: ["就读学校"] },
  { label: "国籍", aliases: ["国籍"] },
  { label: "生日", aliases: ["生日", "出生日期"] },
  { label: "语言成绩", aliases: ["语言成绩"] },
  { label: "标化考试", aliases: ["标化考试"] },
  { label: "AP分数", aliases: ["AP分数"] },
  { label: "目前GPA", aliases: ["目前GPA", "GPA"] },
] as const;

const legacyOcrSectionHeadings = [
  "关键摘要",
  "申请时间轴",
  "基础信息",
  "材料收集",
  "阶段性反馈",
  "本次阶段性进度",
  "下一阶段计划",
  "下月计划",
  "当前阶段重点和下一步建议",
  "需要学生/家庭配合",
  "学生/家庭待办",
  "院校申请",
  "附件",
];

const legacyTimelineLabels = [
  "文书素材收集",
  "主文书写作",
  "早申定校定专",
  "早申请准备",
  "早申请提交",
  "UC申请准备",
  "UC申请提交",
  "常规申请准备",
  "常规申请提交",
  "申请状态跟进",
  "确认入读",
  "行前准备",
  "签证准备",
];

function cleanLegacyOcrValue(value: string) {
  return value
    .replace(/^[\s:：.,，。、|｜_\-]+/, "")
    .replace(/[\s|｜]+$/, "")
    .trim();
}

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findLooseLegacyLabel(line: string, label: string) {
  const pattern = Array.from(label)
    .map((character) => escapeRegularExpression(character))
    .join("\\s*");
  const match = new RegExp(pattern, "i").exec(line);
  if (!match || typeof match.index !== "number") return null;
  return { index: match.index, length: match[0].length };
}

export function recoverLegacyOcrFieldLines(rawText: string) {
  const lines = normalizeLegacyReportText(rawText)
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const recovered: string[] = [];

  legacyOcrFieldSpecs.forEach((spec) => {
    for (const alias of spec.aliases) {
      const matchedLine = lines
        .map((line) => ({ line, match: findLooseLegacyLabel(line, alias) }))
        .find((candidate) => candidate.match);
      if (!matchedLine?.match) continue;
      let value = cleanLegacyOcrValue(
        matchedLine.line.slice(
          matchedLine.match.index + matchedLine.match.length,
        ),
      );
      const nextLabelIndex = legacyOcrFieldSpecs
        .flatMap((candidate) => candidate.aliases)
        .map((candidate) => findLooseLegacyLabel(value, candidate)?.index ?? -1)
        .filter((index) => index > 0)
        .sort((left, right) => left - right)[0];
      if (typeof nextLabelIndex === "number") {
        value = cleanLegacyOcrValue(value.slice(0, nextLabelIndex));
      }
      if (value && value.length <= 180) {
        recovered.push(`${spec.label}：${value}`);
        break;
      }
    }
  });

  return recovered.join("\n");
}

function findEmbeddedLegacyHeading(line: string, heading: string) {
  const normalizedLine = line.replace(/\s*\/\s*/g, "/");
  const index = normalizedLine.indexOf(heading);
  if (index < 0) return null;
  const prefix = normalizedLine.slice(0, index).trim();
  const suffix = normalizedLine.slice(index + heading.length).trim();
  if (heading === "阶段性反馈" && /^\s*报告/.test(suffix)) return null;
  if (prefix.length > 28 && suffix.length > 0) return null;
  if (suffix.length > 80) return null;
  return { prefix, suffix };
}

function stripLegacyTimelinePrefix(line: string) {
  const labelPattern = legacyTimelineLabels
    .map((label) =>
      Array.from(label)
        .map((character) => escapeRegularExpression(character))
        .join("\\s*"),
    )
    .join("|");
  const match = new RegExp(`^(?:${labelPattern})`, "i").exec(line);
  if (!match) return line.trim();

  const cleaned = line
    .slice(match[0].length)
    .replace(/^\s*(?:已\s*完\s*成|进\s*行\s*中|待\s*推\s*进|推\s*进)/, "")
    .trim();
  if (cleaned.length <= 12 && !/[.,，。；;:：]/.test(cleaned)) return "";
  return cleaned;
}

function isLegacySchoolTableBoundary(line: string) {
  const compact = line.replace(/\s+/g, "");
  return (
    compact.includes("申请大学英文名称") ||
    (/^录取专业和?$/.test(compact) && compact.length <= 6) ||
    (compact.includes("申请学院") && compact.includes("申请轮次"))
  );
}

export function extractLegacyOcrSection(
  rawText: string,
  headings: string[],
) {
  const lines = normalizeLegacyReportText(rawText)
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  let startIndex = -1;
  let inlineBody = "";

  for (let index = 0; index < lines.length && startIndex < 0; index += 1) {
    for (const heading of headings) {
      const match = findEmbeddedLegacyHeading(lines[index], heading);
      if (!match) continue;
      startIndex = index;
      inlineBody = cleanLegacyOcrValue(match.suffix);
      break;
    }
  }
  if (startIndex < 0) return "";

  const bodyLines = inlineBody ? [inlineBody] : [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (isLegacySchoolTableBoundary(lines[index])) break;
    const nextSectionMatch = legacyOcrSectionHeadings
      .map((heading) => findEmbeddedLegacyHeading(lines[index], heading))
      .find(Boolean);
    if (nextSectionMatch) {
      const trailingBody = stripLegacyTimelinePrefix(nextSectionMatch.prefix);
      if (trailingBody) bodyLines.push(trailingBody);
      break;
    }
    const cleaned = stripLegacyTimelinePrefix(lines[index]);
    if (!cleaned || (cleaned.length <= 4 && !/[.,，。；;:：]/.test(cleaned))) {
      continue;
    }
    bodyLines.push(cleaned);
  }

  return bodyLines.join("\n").trim();
}

type PositionedTextItem = LegacyPdfTextItem & {
  x: number;
  y: number;
  endX: number;
};

function isHanCharacter(value: string) {
  return /[\u3400-\u9fff]/.test(value);
}

export function normalizeLegacyReportText(value: string) {
  let normalized = value
    .normalize("NFKC")
    .replace(/\r/g, "\n")
    .replace(/\u2028/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n");
  let previous = "";

  while (previous !== normalized) {
    previous = normalized;
    normalized = normalized.replace(
      /([\u3400-\u9fff])[ \t]+(?=[\u3400-\u9fff])/g,
      "$1",
    );
  }

  return normalized
    .replace(/[ \t]*([:;，。、；])[ \t]*/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toPositionedItem(item: LegacyPdfTextItem): PositionedTextItem {
  const x = Number(item.transform[4] ?? 0);
  const y = Number(item.transform[5] ?? 0);
  return {
    ...item,
    str: item.str.normalize("NFKC"),
    x,
    y,
    endX: x + Number(item.width || 0),
  };
}

function groupItemsByLine(items: PositionedTextItem[], tolerance = 1.8) {
  const lines: PositionedTextItem[][] = [];

  [...items]
    .sort((left, right) => right.y - left.y || left.x - right.x)
    .forEach((item) => {
      const line = lines.find(
        (candidate) => Math.abs((candidate[0]?.y ?? item.y) - item.y) <= tolerance,
      );
      if (line) line.push(item);
      else lines.push([item]);
    });

  return lines
    .map((line) => line.sort((left, right) => left.x - right.x))
    .sort((left, right) => (right[0]?.y ?? 0) - (left[0]?.y ?? 0));
}

function joinLineItems(items: PositionedTextItem[]) {
  let result = "";
  let previous: PositionedTextItem | null = null;

  items.forEach((item) => {
    const text = item.str.trim();
    if (!text) return;
    if (previous && result) {
      const gap = item.x - previous.endX;
      const previousLast = result.at(-1) ?? "";
      const nextFirst = text[0] ?? "";
      if (
        gap > 1.8 &&
        !isHanCharacter(previousLast) &&
        !isHanCharacter(nextFirst) &&
        !/^[,.;:)/]/.test(nextFirst)
      ) {
        result += " ";
      }
    }
    result += text;
    previous = item;
  });

  return result.replace(/\s+/g, " ").trim();
}

export function pdfTextItemsToLines(items: LegacyPdfTextItem[]) {
  const positioned = items
    .filter((item) => item.str.trim())
    .map(toPositionedItem);
  return groupItemsByLine(positioned)
    .map(joinLineItems)
    .filter(Boolean);
}

function normalizedHeader(value: string) {
  return normalizeLegacyReportText(value).replace(/\s+/g, "");
}

function isApplicationRound(value: string) {
  const normalized = normalizedHeader(value);
  return (
    /(?:^|[^A-Z])(?:ED1|ED2|REA|SCEA|EA|ED|RD|RA|UC|CA|OUAC|ROLLING|REGULAR|EARLY)(?:$|[^A-Z])/i.test(
      normalized,
    ) ||
    /^(?:\d{1,2}[./-]\d{1,2}|早申|常规|滚动|待定|未定)$/i.test(normalized)
  );
}

function clusterHeaderItems(items: PositionedTextItem[]) {
  const clusters: PositionedTextItem[][] = [];
  const sorted = [...items].sort((left, right) => left.x - right.x || right.y - left.y);

  sorted.forEach((item) => {
    const current = clusters.at(-1);
    const currentEnd = current
      ? Math.max(...current.map((candidate) => candidate.endX))
      : Number.NEGATIVE_INFINITY;
    if (!current || item.x - currentEnd > 11.5) clusters.push([item]);
    else current.push(item);
  });

  return clusters;
}

function joinCellItems(items: PositionedTextItem[]) {
  return groupItemsByLine(items)
    .map(joinLineItems)
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([,.;:)])/g, "$1")
    .trim();
}

export function extractSchoolApplicationRowsFromPdfItems(
  sourceItems: LegacyPdfTextItem[],
) {
  const items = sourceItems
    .filter((item) => item.str.trim())
    .map(toPositionedItem);
  const lines = groupItemsByLine(items);
  const headerLine = lines.find((line) => {
    const text = normalizedHeader(joinLineItems(line));
    return (
      text.includes("申请大学英文名称") ||
      text.includes("申请院校英文名称") ||
      (text.includes("申请学院") && text.includes("申请轮次"))
    );
  });

  if (!headerLine?.length) return null;
  const headerY = headerLine.reduce((sum, item) => sum + item.y, 0) / headerLine.length;
  const headerItems = items.filter((item) => Math.abs(item.y - headerY) <= 7);
  const headerClusters = clusterHeaderItems(headerItems);
  const headers = headerClusters.map((cluster) =>
    normalizedHeader(joinCellItems(cluster)),
  );
  const roundColumnIndex = headers.findIndex((header) =>
    header.includes("申请轮次"),
  );

  if (headers.length < 5 || roundColumnIndex < 0) return null;

  const columnStarts = headerClusters.map((cluster) =>
    Math.min(...cluster.map((item) => item.x)),
  );
  const boundaries = columnStarts.slice(1).map((start) => start - 0.5);
  const columnIndexForX = (x: number) => {
    const index = boundaries.findIndex((boundary) => x < boundary);
    return index < 0 ? columnStarts.length - 1 : index;
  };
  const bodyItems = items.filter((item) => item.y < headerY - 8);
  const roundLines = groupItemsByLine(
    bodyItems.filter((item) => columnIndexForX(item.x) === roundColumnIndex),
  );
  const anchors = roundLines
    .map((line) => ({ y: line[0]?.y ?? 0, value: joinLineItems(line) }))
    .filter(({ value }) => isApplicationRound(value))
    .map(({ y }) => y)
    .sort((left, right) => right - left);

  if (anchors.length === 0) return null;

  const rows = anchors.map((anchor, rowIndex) => {
    const previousAnchor = anchors[rowIndex - 1] ?? headerY;
    const nextAnchor = anchors[rowIndex + 1] ?? anchor - (previousAnchor - anchor);
    const upperBound = (previousAnchor + anchor) / 2;
    const lowerBound = (anchor + nextAnchor) / 2;
    const rowItems = bodyItems.filter(
      (item) => item.y <= upperBound && item.y > lowerBound,
    );

    return columnStarts.map((_, columnIndex) =>
      joinCellItems(
        rowItems.filter((item) => columnIndexForX(item.x) === columnIndex),
      ),
    );
  });

  return [headers, ...rows.filter((row) => row.some(Boolean))];
}

function formatLegacyDate(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 8) return value.trim();
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
}

function isGenericReportFileNameCandidate(value: string) {
  const normalized = value.normalize("NFKC").trim();
  const compact = normalized.replace(/[\s_-]+/g, "");
  return (
    !normalized ||
    /^(?:codex[-_ ]?clipboard|screen(?:shot)?|screenshot|截屏|截图|微信图片|image|img|photo)/i.test(
      normalized,
    ) ||
    /^[0-9a-f-]{20,}$/i.test(compact) ||
    /^(?:反馈报告|申请季|报告)$/i.test(normalized)
  );
}

export function inferLegacyPdfIdentity(
  fileName: string,
  title: string,
  author: string,
  rawText: string,
): LegacyPdfIdentity {
  const stem = fileName.replace(/\.(?:pdf|png|jpe?g|webp|bmp)$/i, "").trim();
  const normalizedSource = normalizeLegacyReportText(
    [stem, title, rawText].filter(Boolean).join("\n"),
  );
  const compactSource = normalizedSource.replace(/\s+/g, "");
  const applicationType =
    APPLICATION_TYPE_OPTIONS.find((option) => compactSource.includes(option)) ?? null;
  const fileSegments = stem.split("_").map((segment) => segment.trim()).filter(Boolean);
  const firstTypeIndex = fileSegments.findIndex((segment) =>
    APPLICATION_TYPE_OPTIONS.some((option) => segment.includes(option)),
  );
  const studentNameFromFile =
    firstTypeIndex > 0 ? fileSegments.slice(0, firstTypeIndex).join("_") : fileSegments[0] ?? "";
  const reportTitleLine = normalizeLegacyReportText(rawText)
    .split(/\n/)
    .map((line) => line.trim())
    .find(
      (line) =>
        /阶段性反馈报告/.test(line) &&
        line.length <= 40 &&
        !/报告日期/.test(line),
    );
  const labeledStudentMatch = normalizeLegacyReportText(rawText).match(
    /学生姓名\s*[:：]\s*([^\s，,。；;|]+)/,
  );
  const titleStudentMatch = (title || reportTitleLine || "")
    .normalize("NFKC")
    .match(
      /^\s*([^\s_]+?)(?=(?:申请季|美国|加拿大|综合评价|中外合办|20\d{2}))/, 
    );
  const safeStudentNameFromFile = isGenericReportFileNameCandidate(studentNameFromFile)
    ? ""
    : studentNameFromFile;
  const studentName =
    labeledStudentMatch?.[1]?.trim() ||
    safeStudentNameFromFile ||
    titleStudentMatch?.[1]?.trim() ||
    "";
  const seasonMatch = normalizedSource.match(/20\d{2}\s*(?:秋|春|Fall|Spring)/i);
  const dateMatch =
    stem.match(/(?:^|_)((?:19|20)\d{6})(?:_|$)/) ??
    normalizedSource.match(/报告日期\s*[:：]?\s*((?:19|20)\d{6})/);
  const reportTitle =
    reportTitleLine &&
    studentName &&
    /^申请季阶段性反馈报告$/.test(reportTitleLine.replace(/\s+/g, ""))
      ? `${studentName}${reportTitleLine}`
      : reportTitleLine;

  return {
    studentName,
    applicationType,
    season: seasonMatch?.[0]?.replace(/\s+/g, "") ?? "",
    reportDate: dateMatch?.[1] ? formatLegacyDate(dateMatch[1]) : "",
    reportTitle:
      reportTitle ||
      (studentName ? `${studentName}申请季阶段性反馈报告` : title.trim()),
    departmentLabel: author.trim(),
  };
}

