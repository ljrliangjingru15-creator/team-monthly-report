import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { NextResponse, type NextRequest } from "next/server";

const execFileAsync = promisify(execFile);

const swiftOcrScript = `
import AppKit
import Foundation
import Vision

let imagePath = CommandLine.arguments[1]
let imageUrl = URL(fileURLWithPath: imagePath)

guard let image = NSImage(contentsOf: imageUrl) else {
  print("")
  exit(0)
}

var proposedRect = CGRect(origin: .zero, size: image.size)
guard let cgImage = image.cgImage(forProposedRect: &proposedRect, context: nil, hints: nil) else {
  print("")
  exit(0)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.recognitionLanguages = ["zh-Hans", "en-US"]

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
try handler.perform([request])

let text = (request.results ?? [])
  .compactMap { $0.topCandidates(1).first?.string }
  .joined(separator: "\\n")

print(text)
`;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (process.env.ENABLE_MACOS_OCR !== "true") {
    return NextResponse.json({
      text: "",
      unavailable: true,
      reason:
        "Server-side OCR is disabled in production. Please upload Excel/CSV data or enter recognized text manually.",
    });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ text: "" }, { status: 400 });
  }

  const workspace = await mkdtemp(`${tmpdir()}/monthly-report-ocr-`);
  const imagePath = `${workspace}/application-screenshot.png`;
  const scriptPath = `${workspace}/recognize.swift`;

  try {
    await writeFile(imagePath, new Uint8Array(await file.arrayBuffer()));
    await writeFile(scriptPath, swiftOcrScript);
    const { stdout } = await execFileAsync("/usr/bin/swift", [scriptPath, imagePath], {
      env: {
        ...process.env,
        CLANG_MODULE_CACHE_PATH: `${workspace}/clang-module-cache`,
      },
      timeout: 30_000,
      maxBuffer: 1024 * 1024,
    });

    return NextResponse.json({ text: stdout.trim() });
  } catch {
    return NextResponse.json({ text: "" });
  } finally {
    await rm(workspace, { force: true, recursive: true });
  }
}
