// İstemci-güvenli CV şablon kimlikleri ve doğrulama.
// Render kodu lib/cvDocument.tsx içinde kalır (yalnız sunucu, @react-pdf/renderer).

export const CV_TEMPLATE_IDS = [
  'classic',
  'modern',
  'minimal',
  'elegant',
  'professional',
  'creative',
  'bold',
] as const

export type CvTemplate = (typeof CV_TEMPLATE_IDS)[number]

export function normalizeTemplate(value: string | null | undefined): CvTemplate {
  return CV_TEMPLATE_IDS.includes(value as CvTemplate) ? (value as CvTemplate) : 'classic'
}

export type CvLayout = 'single' | 'sidebar' | 'band'

export interface TemplateVisual {
  /** single = tek kolon, sidebar = yan panel, band = üstte renkli bant başlık. */
  layout: CvLayout
  accent: string
  /** single: başlık ortalı mı (minimal/elegant). */
  centered: boolean
  /** sidebar: dolu renk + açık metin mi (creative). */
  sidebarFilled: boolean
}

/**
 * Tüm yüzeylerin (PDF motoru lib/cvDocument.tsx, canlı önizleme CvPreview,
 * thumbnail TemplatePicker) paylaştığı TEK görsel kaynak.
 */
export const TEMPLATE_VISUALS: Record<CvTemplate, TemplateVisual> = {
  classic: { layout: 'single', accent: '#1f2937', centered: false, sidebarFilled: false },
  professional: { layout: 'single', accent: '#1e3a8a', centered: false, sidebarFilled: false },
  minimal: { layout: 'single', accent: '#111111', centered: true, sidebarFilled: false },
  elegant: { layout: 'single', accent: '#6d28d9', centered: true, sidebarFilled: false },
  modern: { layout: 'sidebar', accent: '#7c3aed', centered: false, sidebarFilled: false },
  creative: { layout: 'sidebar', accent: '#c026d3', centered: false, sidebarFilled: true },
  bold: { layout: 'band', accent: '#0d9488', centered: false, sidebarFilled: false },
}
