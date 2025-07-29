// @ts-ignore
import { fromBuffer } from "pdf2pic";

export async function convertPdfToPngBuffers(
  buffer: Buffer
): Promise<Buffer[]> {
  const convert = fromBuffer(buffer, {
    density: 200,
    format: "png",
    savePath: "/tmp", // doesn't matter since we use base64
  });

  try {
    const { base64 } = await convert(1, { responseType: "base64" });

    if (!base64) throw new Error("No base64 returned from PDF conversion");

    return [Buffer.from(base64, "base64")];
  } catch (err) {
    console.error("PDF to PNG conversion failed:", err);
    return [];
  }
}
