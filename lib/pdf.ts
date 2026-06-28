import pdfParse from 'pdf-parse'

const MAX_TEXT_LENGTH = 15000

/**
 * PostgreSQL metin sütunları null byte (0x00) ve diğer C0 kontrol
 * karakterlerini kabul etmez; bunlar temizlenmezse Supabase
 * "unsupported Unicode escape sequence" hatası verir. Sekme/satır sonu
 * dışındaki 0x00–0x1F aralığını boşlukla değiştirir.
 */
function stripControlChars(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    const isAllowedWhitespace = code === 9 || code === 10 || code === 13
    out += code < 32 && !isAllowedWhitespace ? ' ' : text[i]
  }
  return out
}

/** Extracts plain text from a PDF buffer, truncated to a safe length. */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer)
  return stripControlChars(result.text)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TEXT_LENGTH)
}
