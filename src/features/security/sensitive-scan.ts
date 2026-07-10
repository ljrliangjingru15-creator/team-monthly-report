const forbiddenPatterns = [
  /password/i,
  /密码/,
  /账号[:：]?\S+/,
  /账密/,
  /portalPassword/i,
  /accountPassword/i,
  /学生电话/,
  /家长电话/,
  /家庭电话/,
  /手机号/,
  /phone/i,
  /mobile/i,
  /合同金额[:：]?\s*\d+/,
  /内部责任/,
  /交接处理/,
];

export type SensitiveScanResult = {
  safe: boolean;
  matches: string[];
};

export function scanForSensitiveContent(value: unknown): SensitiveScanResult {
  const text = JSON.stringify(value);
  const matches = forbiddenPatterns
    .filter((pattern) => pattern.test(text))
    .map((pattern) => pattern.source);

  return {
    safe: matches.length === 0,
    matches,
  };
}

export function assertNoSensitiveContent(value: unknown) {
  const result = scanForSensitiveContent(value);
  if (!result.safe) {
    throw new Error(`发现敏感信息：${result.matches.join(", ")}`);
  }
}
