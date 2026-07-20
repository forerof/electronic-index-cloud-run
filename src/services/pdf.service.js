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
  } catch (error) {
    error.status = 400;
    error.message = "The file is not a valid PDF.";
    throw error;
  } finally {
    await parser.destroy();
  }
}