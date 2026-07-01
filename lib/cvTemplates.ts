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
  // Fotoğraflı (hazır tam tasarım şablonlar — fotoğraf + iki kolon)
  'vitrin',
  'mimar',
  'pastel',
  'teknik',
  'sadeavukat',
  'zarifyesil',
  'zaman',
  'yildiz',
  'grafik',
] as const

export type CvTemplate = (typeof CV_TEMPLATE_IDS)[number]

export function normalizeTemplate(value: string | null | undefined): CvTemplate {
  return CV_TEMPLATE_IDS.includes(value as CvTemplate) ? (value as CvTemplate) : 'classic'
}

// --- Tasarım token'ları --------------------------------------------------------
export type CvLayout = 'single' | 'sidebar' | 'band'
/** Bölüm başlığı stili: alt çizgi · sol accent bar · dolu kutu · sade harf-aralıklı · hap · zaman çizelgesi. */
export type HeadingStyle = 'underline' | 'bar' | 'boxed' | 'plain' | 'pill' | 'timeline'
/** Beceri gösterimi: pill çipler · madde listesi · tek satır ayraçlı · yıldız · çubuk. */
export type SkillStyle = 'chips' | 'bullets' | 'inline' | 'stars' | 'bars'
/** Dil gösterimi: düz metin · yıldız · çubuk. */
export type LangStyle = 'text' | 'stars' | 'bars'
export type Density = 'compact' | 'normal' | 'relaxed'
export type TemplateCategory = 'simple' | 'professional' | 'modern' | 'creative' | 'photo'
/** Fotoğraf çerçeve şekli. */
export type PhotoShape = 'circle' | 'rounded' | 'square'
/** İki-kolon şablonlarda bir bölümün adı (yan panel/ana kolon dağılımı için). */
export type CvSectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'certifications'
  | 'projects'
  | 'contact'

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

  // --- Fotoğraflı "tam tasarım" şablonlar için opsiyonel token'lar ---
  // Hepsi opsiyonel; tanımlı değilse mevcut 14 şablonun davranışı değişmez.
  /** Serif başlık/isim ailesi. */
  font?: 'sans' | 'serif'
  /** Dil gösterim stili (varsayılan 'text'). */
  langStyle?: LangStyle
  /** Fotoğraf çerçeve şekli (yan panelde). */
  photoShape?: PhotoShape
  /** Fotoğraf çevresi çerçeve rengi. */
  photoBorder?: string
  /** İsim bloğu nerede: ana kolon · yan panel · üst bant. Varsayılan 'main'. */
  nameIn?: 'main' | 'sidebar' | 'band'
  /** Başlık (headline) metin rengi. */
  headlineColor?: string
  /** Yan panel arka planı (accent'ten türetmek yerine). */
  sidebarBg?: string
  /** Yan panel metin rengi. */
  sidebarText?: string
  /** Yan panel bölüm başlığı rengi. */
  sidebarHeadColor?: string
  /** Ana kolon arka planı (koyu-ana panelli tasarımlar için). */
  mainBg?: string
  /** Ana kolon metin rengi. */
  mainText?: string
  /** Yan panele düşen bölümler (sıralı). */
  sidebarSections?: CvSectionKey[]
  /** Ana kolona düşen bölümler (sıralı). */
  mainSections?: CvSectionKey[]
  /** Yan panel genişlik oranı (ör. 0.34). */
  sideWidth?: number
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

  // ---- Fotoğraflı (hazır tam tasarım) ----
  // Koyu lacivert ana panel + turuncu vurgu; sol açık sütunda fotoğraf + yıldızlı beceri/dil.
  vitrin: {
    id: 'vitrin', category: 'photo', layout: 'sidebar', accent: '#e2882c', headerAlign: 'left',
    headingStyle: 'plain', skillStyle: 'stars', langStyle: 'stars', sidebarSide: 'left', sidebarFilled: false,
    density: 'normal', nameSize: 30, photoShape: 'rounded', photoBorder: '#e2882c', nameIn: 'main', headlineColor: '#e2882c',
    sidebarBg: '#ffffff', sidebarText: '#334155', sidebarHeadColor: '#334155',
    mainBg: '#1f2a44', mainText: '#e6eaf1',
    sidebarSections: ['languages', 'skills'], mainSections: ['summary', 'education', 'experience', 'contact'],
    sideWidth: 0.36,
  },
  // Sağ dar lacivert sidebar (fotoğraf/iletişim/eğitim); sol geniş açık kolon, koyu kutu başlıklar, çubuk beceriler.
  mimar: {
    id: 'mimar', category: 'photo', layout: 'sidebar', accent: '#12354f', headerAlign: 'left',
    headingStyle: 'boxed', skillStyle: 'bars', langStyle: 'text', sidebarSide: 'right', sidebarFilled: true,
    density: 'normal', nameSize: 30, photoShape: 'circle', nameIn: 'main', headlineColor: '#12354f',
    sidebarSections: ['contact', 'education', 'certifications', 'languages'],
    mainSections: ['summary', 'experience', 'skills'],
    sideWidth: 0.36,
  },
  // Sol pastel (pembe/lila) sidebar + yuvarlak fotoğraf; sağ beyaz ana kolon, sade başlıklar.
  pastel: {
    id: 'pastel', category: 'photo', layout: 'sidebar', accent: '#b76e8f', headerAlign: 'left',
    headingStyle: 'plain', skillStyle: 'inline', langStyle: 'text', sidebarSide: 'left', sidebarFilled: false,
    density: 'normal', nameSize: 27, photoShape: 'circle', nameIn: 'main', headlineColor: '#8a5a72', font: 'serif',
    sidebarBg: '#f4dbe4', sidebarText: '#5a4650', sidebarHeadColor: '#3f3138',
    sidebarSections: ['contact', 'education', 'skills', 'languages'], mainSections: ['summary', 'experience'],
    sideWidth: 0.36,
  },
  // Sol açık sütun (kare fotoğraf, lacivert çerçeve); sağ üstte lacivert isim bandı.
  teknik: {
    id: 'teknik', category: 'photo', layout: 'sidebar', accent: '#17365c', headerAlign: 'left',
    headingStyle: 'underline', skillStyle: 'bullets', langStyle: 'text', sidebarSide: 'left', sidebarFilled: false,
    density: 'normal', nameSize: 26, photoShape: 'square', photoBorder: '#17365c', nameIn: 'band', headlineColor: '#e6eaf1',
    sidebarBg: '#eef2f6', sidebarText: '#334155', sidebarHeadColor: '#17365c',
    sidebarSections: ['contact', 'education', 'skills', 'languages'],
    mainSections: ['summary', 'experience', 'certifications'],
    sideWidth: 0.34,
  },
  // Bej/gri sade; sol çerçeveli açık kutu (fotoğraf/iletişim/hakkımda/beceri); sağ gri kutu başlıklar.
  sadeavukat: {
    id: 'sadeavukat', category: 'photo', layout: 'sidebar', accent: '#6b7280', headerAlign: 'left',
    headingStyle: 'boxed', skillStyle: 'bullets', langStyle: 'text', sidebarSide: 'left', sidebarFilled: false,
    density: 'normal', nameSize: 28, photoShape: 'square', nameIn: 'main', headlineColor: '#6b7280',
    sidebarBg: '#f5f4f2', sidebarText: '#3f3f46', sidebarHeadColor: '#27272a',
    sidebarSections: ['contact', 'summary', 'skills'], mainSections: ['education', 'experience'],
    sideWidth: 0.36,
  },
  // Yeşil dolu sol sütun (fotoğraf + serif isim + hakkımda); krem ana kolon.
  zarifyesil: {
    id: 'zarifyesil', category: 'photo', layout: 'sidebar', accent: '#4a5d3a', headerAlign: 'left',
    headingStyle: 'plain', skillStyle: 'bullets', langStyle: 'text', sidebarSide: 'left', sidebarFilled: true,
    density: 'relaxed', nameSize: 30, photoShape: 'square', nameIn: 'sidebar', headlineColor: '#e8ecdf', font: 'serif',
    mainBg: '#f4f1ea', mainText: '#3a3a33',
    sidebarSections: ['contact', 'summary'], mainSections: ['experience', 'education', 'languages'],
    sideWidth: 0.38,
  },
  // Krem sol sütun; sağda bölümleri bağlayan zaman çizelgesi noktalı başlıklar.
  zaman: {
    id: 'zaman', category: 'photo', layout: 'sidebar', accent: '#1f2937', headerAlign: 'left',
    headingStyle: 'timeline', skillStyle: 'bullets', langStyle: 'text', sidebarSide: 'left', sidebarFilled: false,
    density: 'normal', nameSize: 27, photoShape: 'rounded', nameIn: 'main', headlineColor: '#4b5563',
    sidebarBg: '#f3f1ec', sidebarText: '#374151', sidebarHeadColor: '#1f2937',
    sidebarSections: ['summary', 'education', 'skills', 'contact'],
    mainSections: ['experience', 'certifications', 'languages'],
    sideWidth: 0.36,
  },
  // Tam lacivert (her iki kolon); sol fotoğraf + yıldızlı dil/beceri; sağ hap-şekilli başlıklar.
  yildiz: {
    id: 'yildiz', category: 'photo', layout: 'sidebar', accent: '#cf9f6b', headerAlign: 'left',
    headingStyle: 'pill', skillStyle: 'stars', langStyle: 'stars', sidebarSide: 'left', sidebarFilled: true,
    density: 'normal', nameSize: 29, photoShape: 'square', nameIn: 'main', headlineColor: '#cf9f6b',
    sidebarBg: '#16243a', sidebarText: '#dbe2ec', sidebarHeadColor: '#ffffff',
    mainBg: '#1b2c46', mainText: '#dbe2ec',
    sidebarSections: ['contact', 'languages', 'skills'], mainSections: ['education', 'experience'],
    sideWidth: 0.38,
  },
  // Koyu antrasit dolu sol sütun (fotoğraf + isim + hakkımda + çubuk beceri); beyaz ana kolon.
  grafik: {
    id: 'grafik', category: 'photo', layout: 'sidebar', accent: '#3a3a3a', headerAlign: 'left',
    headingStyle: 'underline', skillStyle: 'bars', langStyle: 'text', sidebarSide: 'left', sidebarFilled: true,
    density: 'normal', nameSize: 28, photoShape: 'square', nameIn: 'sidebar', headlineColor: '#d4d4d4',
    sidebarSections: ['summary', 'contact', 'skills'], mainSections: ['experience', 'education'],
    sideWidth: 0.38,
  },
}

export function getTemplate(value: string | null | undefined): CvTemplateDef {
  return TEMPLATES[normalizeTemplate(value)]
}

/** Picker'da kategori başlıkları altında gruplamak için sıra. */
export const TEMPLATE_CATEGORY_ORDER: TemplateCategory[] = ['photo', 'simple', 'professional', 'modern', 'creative']

/** Yoğunluk → ölçek çarpanı (boşluk/satır aralığı). Tüm yüzeyler paylaşır. */
export const DENSITY_SCALE: Record<Density, number> = {
  compact: 0.85,
  normal: 1,
  relaxed: 1.15,
}

/**
 * Dil seviyesi metnini 1–5 yıldıza eşler (yıldız/çubuk stili şablonlar için).
 * "Ana dil / Native / C2" → 5, "İleri / C1" → 4, "Orta / B" → 3, "Başlangıç / A" → 2.
 * Bilinmeyen/boş → 4 (makul varsayılan).
 */
export function langLevelToScore(level: string): number {
  const s = (level || '').toLocaleLowerCase('tr-TR')
  if (!s) return 4
  if (/(ana ?dil|anadil|native|c2|mother|akıcı|akici|fluent)/.test(s)) return 5
  if (/(ileri|advanced|c1|profesyonel|professional|çok iyi|cok iyi)/.test(s)) return 4
  if (/(orta|intermediate|b1|b2|iyi|good)/.test(s)) return 3
  if (/(başlangıç|baslangic|beginner|temel|a1|a2|az)/.test(s)) return 2
  return 4
}

/**
 * Beceri verisinde seviye alanı olmadığından, yıldız/çubuk stili şablonlarda
 * dekoratif ama tutarlı (index'e bağlı) bir 3–5 puan üretir; her render'da sabit.
 */
export function pseudoSkillScore(index: number): number {
  return [5, 4, 5, 4, 3][index % 5]
}
