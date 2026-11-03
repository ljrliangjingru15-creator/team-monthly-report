import { describe, expect, it } from "vitest";
import {
  embedPngReportState,
  readPngReportState,
} from "@/features/monthly-reports/png-report-state";

const onePixelPng = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  ),
  (character) => character.charCodeAt(0),
);

describe("recoverable PNG report state", () => {
  it("embeds and restores UTF-8 report state without changing the PNG format", async () => {
    const state = 'MONTHLY_REPORT_STATE_V1:{"version":1,"studentName":"韦翕"}';
    const output = await embedPngReportState(
      new Blob([onePixelPng], { type: "image/png" }),
      state,
    );

    expect(output.type).toBe("image/png");
    expect(output.size).toBeGreaterThan(onePixelPng.byteLength);
    expect(await readPngReportState(output)).toBe(state);
  });

  it("returns null for PNG files without embedded report state", async () => {
    expect(
      await readPngReportState(new Blob([onePixelPng], { type: "image/png" })),
    ).toBeNull();
  });
});
