import { normalizeHeader } from "./normalize-header";
import type { HeaderInput, SensitiveCategory, SensitiveHeaderMatch } from "./types";

const sensitivePatterns: Array<{
  category: SensitiveCategory;
  patterns: RegExp[];
}> = [
  {
    category: "accountCredential",
    patterns: [
      /账号密码/,
      /账号和密码/,
      /用户名密码/,
      /用户名和密码/,
      /账密/,
      /idpassword/,
      /accountpassword/,
      /logincredential/,
    ],
  },
  {
    category: "password",
    patterns: [/密码/, /password/, /pwd/, /portalpassword/, /邮箱密码/],
  },
  {
    category: "phone",
    patterns: [/学生电话/, /家长电话/, /家庭电话/, /手机号/, /联系电话/, /mobile/, /phone/, /tel/],
  },
  {
    category: "identityDocument",
    patterns: [/身份证/, /护照号/, /证件号/, /passport/, /identity/],
  },
  {
    category: "accountCredential",
    patterns: [/^账号$/, /^account$/, /^username$/, /^userid$/, /^loginid$/],
  },
];

export function detectSensitiveHeader(header: HeaderInput) {
  const normalizedHeader = normalizeHeader(header);
  if (!normalizedHeader) return null;

  for (const { category, patterns } of sensitivePatterns) {
    if (patterns.some((pattern) => pattern.test(normalizedHeader))) {
      return { category, normalizedHeader };
    }
  }

  return null;
}

export function collectSensitiveHeaders(headers: HeaderInput[]) {
  return headers.flatMap((header, index): SensitiveHeaderMatch[] => {
    const match = detectSensitiveHeader(header);
    if (!match) return [];

    return [
      {
        index,
        header: String(header ?? ""),
        normalizedHeader: match.normalizedHeader,
        category: match.category,
      },
    ];
  });
}
