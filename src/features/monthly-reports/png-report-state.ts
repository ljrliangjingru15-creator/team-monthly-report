const pngSignature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

export const monthlyReportPngStateKeyword = "monthly-report-state";

let crcTable: Uint32Array | null = null;

function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) !== 0 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    crcTable[index] = value >>> 0;
  }
  return crcTable;
}

function crc32(bytes: Uint8Array) {
  const table = getCrcTable();
  let value = 0xffffffff;
  for (const byte of bytes) {
    value = table[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function concatenateBytes(parts: Uint8Array[]) {
  const totalLength = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function buildChunk(type: string, data: Uint8Array) {
  const typeBytes = new TextEncoder().encode(type);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(typeBytes, 4);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(concatenateBytes([typeBytes, data])));
  return chunk;
}

function parseChunks(bytes: Uint8Array) {
  if (
    bytes.length < pngSignature.length ||
    !pngSignature.every((value, index) => bytes[index] === value)
  ) {
    return [];
  }

  const chunks: Array<{ bytes: Uint8Array; data: Uint8Array; type: string }> = [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = pngSignature.length;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) break;
    const type = new TextDecoder("latin1").decode(bytes.slice(offset + 4, offset + 8));
    chunks.push({
      bytes: bytes.slice(offset, end),
      data: bytes.slice(offset + 8, offset + 8 + length),
      type,
    });
    offset = end;
    if (type === "IEND") break;
  }
  return chunks;
}

function parseInternationalText(data: Uint8Array) {
  const firstNull = data.indexOf(0);
  if (firstNull < 0 || firstNull + 3 >= data.length) return null;
  const keyword = new TextDecoder("latin1").decode(data.slice(0, firstNull));
  const compressionFlag = data[firstNull + 1];
  if (compressionFlag !== 0) return null;
  const languageEnd = data.indexOf(0, firstNull + 3);
  if (languageEnd < 0) return null;
  const translatedKeywordEnd = data.indexOf(0, languageEnd + 1);
  if (translatedKeywordEnd < 0) return null;
  return {
    keyword,
    text: new TextDecoder().decode(data.slice(translatedKeywordEnd + 1)),
  };
}

export async function embedPngReportState(blob: Blob, state: string) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const chunks = parseChunks(bytes);
  if (!chunks.length) return blob;

  const keywordBytes = new TextEncoder().encode(monthlyReportPngStateKeyword);
  const stateBytes = new TextEncoder().encode(state);
  const internationalTextData = concatenateBytes([
    keywordBytes,
    new Uint8Array([0, 0, 0, 0, 0]),
    stateBytes,
  ]);
  const stateChunk = buildChunk("iTXt", internationalTextData);
  const outputChunks: Uint8Array[] = [pngSignature];
  let inserted = false;

  for (const chunk of chunks) {
    const existingText = chunk.type === "iTXt" ? parseInternationalText(chunk.data) : null;
    if (existingText?.keyword === monthlyReportPngStateKeyword) continue;
    outputChunks.push(chunk.bytes);
    if (!inserted && chunk.type === "IHDR") {
      outputChunks.push(stateChunk);
      inserted = true;
    }
  }

  return new Blob([concatenateBytes(outputChunks)], { type: "image/png" });
}

export async function readPngReportState(file: Blob) {
  const chunks = parseChunks(new Uint8Array(await file.arrayBuffer()));
  for (const chunk of chunks) {
    if (chunk.type !== "iTXt") continue;
    const parsed = parseInternationalText(chunk.data);
    if (parsed?.keyword === monthlyReportPngStateKeyword) return parsed.text;
  }
  return null;
}
