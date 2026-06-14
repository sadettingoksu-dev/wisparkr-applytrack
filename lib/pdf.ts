import pdfParse from 'pdf-parse'

const MAX_TEXT_LENGTH = 15000

/** Extracts plain text from a PDF buffer, truncated to a safe length. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer)
  return result.text.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXT_LENGTH)
}
