import { PDFParse } from "pdf-parse";

export async function getPdfInfo(buffer) {
  const parser = new PDFParse({
    data: buffer,
  });

  try {
    const result = await parser.getInfo();

    return {
      pages: result.total,
    };
  } finally {
    await parser.destroy();
  }
}