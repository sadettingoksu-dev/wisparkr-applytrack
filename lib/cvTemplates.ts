// İstemci-güvenli CV şablon kimlikleri ve doğrulama (pdfkit içermez).
// pdfkit'e bağımlı render kodu lib/cvPdf.ts içinde kalır (yalnız sunucu).

export const CV_TEMPLATE_IDS = [
  'classic',
  'modern',
  'minimal',
  'elegant',
  'professional',
  'creative',
] as const

export type CvTemplate = (typeof CV_TEMPLATE_IDS)[number]

export function normalizeTemplate(value: string | null | undefined): CvTemplate {
  return CV_TEMPLATE_IDS.includes(value as CvTemplate) ? (value as CvTemplate) : 'classic'
}
