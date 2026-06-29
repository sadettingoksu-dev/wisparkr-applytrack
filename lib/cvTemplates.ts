// CV şablonları — TEK görsel kaynak.
// Bu dosya istemci-güvenlidir (yalnız veri + tip). Render eden yüzeyler:
//   - PDF motoru:   lib/cvDocument.tsx (@react-pdf/renderer, yalnız sunucu)
//   - Canlı önizleme: components/cv-builder/CvPreview.tsx (HTML)
//   - Thumbnail:     components/cv/TemplatePicker.tsx
// Üçü de aşağıdaki TEMPLATES'i okur; ayrı tema tablosu YOKTUR (drift olmaz).

export const CV_TEMPLATE_IDS = [
  // Sade
  'classic',
  'minimal',
  'slate',
  // Profesyonel
  'professional',
  'executive',
  'elegant',
  // Modern (iki kolon / yan panel)
  'modern',
  'cobalt',
  'fresh',
  // Yaratıcı (dolu panel / renkli bant)
  'creative',
  'onyx',
  'bold',
  'crimson',
  'amber',
] as const

export type CvTemplate = (typeof CV_TEMPLATE_IDS)[number]

export function normalizeTemplate(value: string | null | undefined): CvTemplate {
  return CV_TEMPLATE_IDS.includes(value as CvTemplate) ? (value as CvTemplate) : 'classic'
}

// --- Tasarım token'ları --------------------------------------------------------
export type CvLayout = 'single' | 'sidebar' | 'band'
/** Bölüm başlığı stili: alt çizgi · sol accent bar · dolu kutu · sade harf-aralıklı. */
export type HeadingStyle = 'underline' | 'bar' | 'boxed' | 'plain'
/** Beceri gösterimi: pill çipler · madde listesi · tek satır ayraçlı. */
export type SkillStyle = 'chips' | 'bullets' | 'inline'
export type Density = 'compact' | 'normal' | 'relaxed'
export type TemplateCategory = 'simple' | 'professional' | 'modern' | 'creative'

export interface CvTemplateDef {
  id: CvTemplate
  category: TemplateCategory
  layout: CvLayout
  /** Vurgu rengi (başlıklar, çizgiler, çipler). */
  accent: string
  /** single + band: başlık bloğu hizası. */
  headerAlign: 'left' | 'center'
  headingStyle: HeadingStyle
  skillStyle: SkillStyle
  /** sidebar: yan panel hangi tarafta. */
  sidebarSide: 'left' | 'right'
  /** sidebar: dolu renkli panel + açık metin (true) ya da hafif tonlu (false). */
  sidebarFilled: boolean
  density: Density
  /** İsim (h1) punto — PDF ve önizleme ölçeği. */
  nameSize: number
}

export const TEMPLATES: Record<CvTemplate, CvTemplateDef> = {
  // ---- Sade ----
  classic: { id: 'classic', category: 'simple', layout: 'single', accent: '#1f2937', headerAlign: 'left', headingStyle: 'underline', skillStyle: 'chips', sidebarSide: 'left', sidebarFilled: false, density: 'normal', nameSize: 22 },
  minimal: { id: 'minimal', category: 'simple', layout: 'single', accent: '#111111', headerAlign: 'center', headingStyle: 'plain', skillStyle: 'inline', sidebarSide: 'left', sidebarFilled: false, density: 'relaxed', nameSize: 21 },
  slate: { id: 'slate', category: 'simple', layout: 'single', accent: '#334155', headerAlign: 'left', headingStyle: 'bar', skillStyle: 'chips', sidebarSide: 'left', sidebarFilled: false, density: 'compact', nameSize: 21 },

  // ---- Profesyonel ----
  professional: { id: 'professional', category: 'professional', layout: 'single', accent: '#1e3a8a', headerAlign: 'left', headingStyle: 'bar', skillStyle: 'chips', sidebarSide: 'left', sidebarFilled: false, density: 'normal', nameSize: 22 },
  executive: { id: 'executive', category: 'professional', layout: 'single', accent: '#0f172a', headerAlign: 'left', headingStyle: 'boxed', skillStyle: 'chips', sidebarSide: 'left', sidebarFilled: false, density: 'normal', nameSize: 22 },
  elegant: { id: 'elegant', category: 'professional', layout: 'single', accent: '#6d28d9', headerAlign: 'center', headingStyle: 'underline', skillStyle: 'inline', sidebarSide: 'left', sidebarFilled: false, density: 'relaxed', nameSize: 23 },

  // ---- Modern (iki kolon) ----
  modern: { id: 'modern', category: 'modern', layout: 'sidebar', accent: '#7c3aed', headerAlign: 'left', headingStyle: 'bar', skillStyle: 'bullets', sidebarSide: 'left', sidebarFilled: false, density: 'normal', nameSize: 23 },
  cobalt: { id: 'cobalt', category: 'modern', layout: 'sidebar', accent: '#2563eb', headerAlign: 'left', headingStyle: 'bar', skillStyle: 'bullets', sidebarSide: 'right', sidebarFilled: false, density: 'normal', nameSize: 23 },
  fresh: { id: 'fresh', category: 'modern', layout: 'sidebar', accent: '#059669', headerAlign: 'left', headingStyle: 'plain', skillStyle: 'bullets', sidebarSide: 'right', sidebarFilled: false, density: 'normal', nameSize: 22 },

  // ---- Yaratıcı ----
  creative: { id: 'creative', category: 'creative', layout: 'sidebar', accent: '#c026d3', headerAlign: 'left', headingStyle: 'plain', skillStyle: 'bullets', sidebarSide: 'left', sidebarFilled: true, density: 'normal', nameSize: 24 },
  onyx: { id: 'onyx', category: 'creative', layout: 'sidebar', accent: '#0f172a', headerAlign: 'left', headingStyle: 'plain', skillStyle: 'bullets', sidebarSide: 'left', sidebarFilled: true, density: 'compact', nameSize: 23 },
  bold: { id: 'bold', category: 'creative', layout: 'band', accent: '#0d9488', headerAlign: 'left', headingStyle: 'underline', skillStyle: 'chips', sidebarSide: 'left', sidebarFilled: false, density: 'normal', nameSize: 24 },
  crimson: { id: 'crimson', category: 'creative', layout: 'band', accent: '#be123c', headerAlign: 'left', headingStyle: 'bar', skillStyle: 'chips', sidebarSide: 'left', sidebarFilled: false, density: 'normal', nameSize: 24 },
  amber: { id: 'amber', category: 'creative', layout: 'band', accent: '#b45309', headerAlign: 'center', headingStyle: 'boxed', skillStyle: 'chips', sidebarSide: 'left', sidebarFilled: false, density: 'normal', nameSize: 23 },
}

export function getTemplate(value: string | null | undefined): CvTemplateDef {
  return TEMPLATES[normalizeTemplate(value)]
}

/** Picker'da kategori başlıkları altında gruplamak için sıra. */
export const TEMPLATE_CATEGORY_ORDER: TemplateCategory[] = ['simple', 'professional', 'modern', 'creative']

/** Yoğunluk → ölçek çarpanı (boşluk/satır aralığı). Tüm yüzeyler paylaşır. */
export const DENSITY_SCALE: Record<Density, number> = {
  compact: 0.85,
  normal: 1,
  relaxed: 1.15,
}
