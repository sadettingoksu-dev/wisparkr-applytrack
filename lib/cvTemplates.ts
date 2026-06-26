// İstemci-güvenli CV şablon kimlikleri ve doğrulama.
// Render kodu lib/cvDocument.tsx içinde kalır (yalnız sunucu, @react-pdf/renderer).

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

/** PDF motorundaki (lib/cvDocument.tsx) vurgu renkleriyle eşleşir; önizleme + seçici kullanır. */
export const TEMPLATE_ACCENTS: Record<CvTemplate, string> = {
  classic: '#1f2937',
  professional: '#1e3a8a',
  minimal: '#111111',
  elegant: '#6d28d9',
  modern: '#7c3aed',
  creative: '#c026d3',
}

/** Tek kolon şablonlarda başlık ortalansın mı (minimal/elegant). */
export const TEMPLATE_CENTERED: Record<CvTemplate, boolean> = {
  classic: false,
  professional: false,
  minimal: true,
  elegant: true,
  modern: false,
  creative: false,
}
