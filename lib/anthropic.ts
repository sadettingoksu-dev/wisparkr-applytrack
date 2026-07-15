import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { EmailClassification } from '@/lib/types'
import { cvDataSchema, type CvData } from '@/lib/cv'
import { MOCK_INTERVIEW_QUESTION_COUNT } from '@/utils/constants'

export const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

/** Returns an Anthropic client, or null if ANTHROPIC_API_KEY is not set. */
export function getAnthropicClient(): Anthropic | null {
  if (!isAnthropicConfigured()) return null
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

const tailorCvSchema = z.object({
  tailored_cv: z.string().min(1),
  score: z.number().min(0).max(100),
  suggestions: z.array(z.string()).min(1).max(5),
})

export interface TailorCvResult {
  tailored_cv: string
  score: number
  suggestions: string[]
}

const documentImportanceSchema = z.enum(['critical', 'important', 'optional'])
export type DocumentImportance = z.infer<typeof documentImportanceSchema>

const requiredDocumentsSchema = z.object({
  documents: z
    .array(z.object({ name: z.string().min(1), importance: documentImportanceSchema }))
    .max(5),
})

export interface RequiredDocument {
  name: string
  importance: DocumentImportance
  has: boolean | null
  filename?: string | null
  text?: string | null
}

/** Tüm AI metin çıktılarına eklenen Türkçe yazım kuralı talimatı. */
export const TURKISH_WRITING_RULE =
  'Türkçe yazım kurallarına (TDK) dikkat et: noktalama işaretleri, büyük/küçük harf, ' +
  'bitişik/ayrı yazım ve ek kullanımı doğru olsun; yapay zeka kokan kalıp ifadelerden kaçın.'

/**
 * Mülakat gibi kullanıcıya doğrudan gösterilen/sesli okunan AI çıktılarının dili,
 * arayüz diline (locale) göre belirlenir. Varsayılan Türkçe; diğer diller için
 * modele o dilde yazması net biçimde söylenir.
 */
const INTERVIEW_LANGUAGE_RULE: Record<string, string> = {
  tr: TURKISH_WRITING_RULE,
  en: 'CRITICAL: Write EVERYTHING (every question, message and closing) in natural, fluent ENGLISH. Do not use any Turkish. Avoid robotic, AI-sounding phrasing.',
  de: 'WICHTIG: Schreibe ALLES (jede Frage, Nachricht und den Abschluss) in natürlichem, flüssigem DEUTSCH. Verwende kein Türkisch. Vermeide roboterhafte, KI-typische Formulierungen.',
  es: 'IMPORTANTE: Escribe TODO (cada pregunta, mensaje y el cierre) en un ESPAÑOL natural y fluido. No uses nada de turco. Evita frases robóticas o que suenen a IA.',
  fr: 'IMPORTANT : Rédige TOUT (chaque question, message et la conclusion) dans un FRANÇAIS naturel et fluide. N\'utilise pas de turc. Évite les formulations robotiques ou qui sonnent « IA ».',
}

/** Verilen locale için mülakat dili talimatını döndürür (bilinmiyorsa Türkçe). */
function interviewLanguageRule(locale?: string | null): string {
  return INTERVIEW_LANGUAGE_RULE[locale ?? 'tr'] ?? TURKISH_WRITING_RULE
}

/**
 * Analyzes a job posting and returns up to 5 sector-specific
 * documents/certificates candidates are typically expected to have
 * (e.g. "Kimyasal Güvenlik Sertifikası" for a chemistry role). Returns an
 * empty list for generic postings that don't call for extra documents.
 */
export async function analyzeRequiredDocuments(
  anthropic: Anthropic,
  job: { company_name: string; position_title: string; job_description: string | null }
): Promise<{ name: string; importance: DocumentImportance }[]> {
  const prompt = [
    'Aşağıda bir iş ilanı var. Bu ilanın ait olduğu sektör/alan için adayların',
    'CV\'lerinde genellikle bulunması beklenen, İŞE ÖZEL EK BELGE/SERTİFİKA/EVRAK',
    'türlerini listele (örnek: kimya mühendisliği ilanı için "Kimyasal Güvenlik/MSDS',
    'Eğitim Sertifikası", elektrik için "İş Güvenliği Uzmanlığı Belgesi", yazılım için',
    '"AWS/Cloud Sertifikası" gibi). İlan genel bir pozisyon olup özel bir belge',
    'gerektirmiyorsa boş liste döndür.',
    '',
    'Her belge için önem derecesi belirle:',
    '- "critical": bu belge olmadan başvuru ciddi şekilde zayıf kalır',
    '- "important": olması büyük avantaj ama olmazsa eleme sebebi değil',
    '- "optional": varsa iyi olur ama etkisi azdır',
    '',
    'En fazla 5 belge döndür. Belge adlarını yazarken ' + TURKISH_WRITING_RULE,
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
    '{"documents": [{"name": "...", "importance": "critical|important|optional"}, ...]}',
    '',
    `İş ilanı (${job.company_name} - ${job.position_title}):`,
    (job.job_description || 'Açıklama yok').slice(0, 4000),
  ].join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = requiredDocumentsSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data.documents
}

/**
 * Rewrites a candidate's CV text to better match a specific job posting,
 * and scores how application-ready the tailored CV is (0-100). If
 * `documents` is provided, missing critical/important sector-specific
 * documents pull the score down (missing optional ones barely affect it).
 */
export async function tailorCv(
  anthropic: Anthropic,
  cvText: string,
  job: { company_name: string; position_title: string; job_description: string | null },
  documents: RequiredDocument[] = []
): Promise<TailorCvResult> {
  const documentLines = documents.map((doc) => {
    const status = doc.has === true ? 'VAR' : doc.has === false ? 'YOK' : 'BELİRTİLMEDİ'
    const line = `- ${doc.name} (önem: ${doc.importance}, durum: ${status})`
    if (doc.text) {
      return `${line}\n  Belge içeriği (özet): ${doc.text.slice(0, 1000)}`
    }
    return line
  })

  const prompt = [
    'Aşağıda bir adayın CV metni ve başvurduğu iş ilanının açıklaması var.',
    'CV\'yi bu ilana göre yeniden düzenle: ilanla en alakalı deneyim/becerileri öne çıkar,',
    'ilandaki anahtar kelimelere uygun şekilde ifade et, gereksiz/ilgisiz kısımları kısalt.',
    'Adayın gerçekte sahip olmadığı bir beceri veya deneyimi EKLEME, UYDURMA.',
    'CV\'nin genel yapısını (bölümler, kronoloji) koru, sadece içeriği güçlendir.',
    '',
    'Ardından, yeniden düzenlenmiş CV\'nin bu ilana ne kadar hazır olduğunu 0-100 arası',
    'bir "başvuru hazırlık skoru" ile değerlendir. Skoru hesaplarken CV-ilan uyumuna',
    'EK OLARAK şu sektöre özel belge durumunu da dikkate al:',
    documentLines.length > 0 ? documentLines.join('\n') : '(bu ilan için ek belge gerekmiyor)',
    '',
    'Kural: "critical" önemdeki bir belge YOK ise skoru belirgin şekilde düşür',
    '(yaklaşık 15-25 puan). "important" önemdeki bir belge YOK ise orta düzeyde',
    'düşür (yaklaşık 5-10 puan). "optional" önemdeki bir belge YOK ise skoru',
    'çok az etkile (0-3 puan) veya hiç etkileme. "BELİRTİLMEDİ" durumundaki',
    'belgeleri YOK gibi değerlendirme, dikkate alma.',
    '',
    'Tam olarak 3 somut öneri ver: eksik kritik/önemli belgeler varsa önce onları',
    'öner, kalan önerileri CV/deneyim için ver.',
    '',
    'Yazdığın CV metni ve önerilerde ' + TURKISH_WRITING_RULE,
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
    '{"tailored_cv": "<yeniden düzenlenmiş CV metni>", "score": <0-100 arası sayı>, "suggestions": ["öneri 1", "öneri 2", "öneri 3"]}',
    '',
    `İş ilanı (${job.company_name} - ${job.position_title}):`,
    (job.job_description || 'Açıklama yok').slice(0, 4000),
    '',
    'CV:',
    cvText.slice(0, 8000),
  ].join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = tailorCvSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

const cvDiagnosisItemSchema = z.object({
  id: z.string().min(1),
  category: z.enum(['document', 'skill', 'experience', 'keyword', 'format']),
  title: z.string().min(1),
  severity: z.enum(['critical', 'important', 'minor']),
  impact: z.number().min(0).max(40),
  diagnosis: z.string().min(1),
  fix: z.string().min(1),
  kind: z.enum(['have_or_not', 'improve']),
})

const cvDiagnosisSchema = z.object({
  overall_score: z.number().min(0).max(100),
  summary: z.string().min(1),
  items: z.array(cvDiagnosisItemSchema).max(8),
})

export type CvDiagnosisCategory = z.infer<typeof cvDiagnosisItemSchema>['category']
export type CvDiagnosisSeverity = z.infer<typeof cvDiagnosisItemSchema>['severity']
export type CvDiagnosisKind = z.infer<typeof cvDiagnosisItemSchema>['kind']

export interface CvDiagnosisItem {
  id: string
  category: CvDiagnosisCategory
  title: string
  severity: CvDiagnosisSeverity
  /** Bu arıza giderilirse başvuru hazırlık skoruna eklenmesi beklenen kabaca puan. */
  impact: number
  /** "Arıza": CV'nin bu ilana karşı zayıf/eksik yönü. */
  diagnosis: string
  /** "Onarım": ne yapılması gerektiği (aksiyon). */
  fix: string
  /** have_or_not: aday ya sahiptir ya değildir (belge/sertifika). improve: sihirbaz CV içeriğinde düzeltir. */
  kind: CvDiagnosisKind
}

export interface CvDiagnosisResult {
  /** Onarımdan ÖNCE mevcut başvuru hazırlık skoru (0-100). */
  overall_score: number
  summary: string
  items: CvDiagnosisItem[]
}

/**
 * "CV araba tamiri" teşhisi: adayın CV'sini belirli bir ilana karşı bir usta
 * gibi muayene eder ve giderilebilir "arıza" listesi çıkarır. Her arıza için
 * önem, tahmini puan etkisi, arıza açıklaması ve onarım aksiyonu döner; ayrıca
 * onarımdan önceki genel hazırlık skorunu verir. Adayın sahip olmadığı bir şeyi
 * uydurmaz — yalnızca CV ile ilan arasındaki gerçek boşlukları teşhis eder.
 */
export async function diagnoseCv(
  anthropic: Anthropic,
  cvText: string,
  job: { company_name: string; position_title: string; job_description: string | null }
): Promise<CvDiagnosisResult> {
  const prompt = [
    'Sen bir kariyer koçu ve CV ustasısın. Aşağıda bir adayın CV metni ve başvurduğu',
    'iş ilanı var. CV\'yi bu ilana karşı bir arabanın servise alınması gibi MUAYENE et',
    've giderilebilir "arıza" listesi çıkar.',
    '',
    'Önce onarımdan ÖNCEKİ mevcut durumu 0-100 arası bir "başvuru hazırlık skoru" ile',
    'değerlendir ("overall_score"). Ardından en fazla 8 arıza (item) listele.',
    'En yüksek etkili arızayı BAŞA koy (impact\'e göre azalan sırala).',
    '',
    'Her arıza için:',
    '- "category": arıza türü → "document" (ilana özel belge/sertifika eksik),',
    '  "skill" (ilanın istediği beceri CV\'de zayıf/yok), "experience" (deneyim',
    '  vurgusu/kanıtı yetersiz), "keyword" (ilandaki anahtar kelimeler CV\'de geçmiyor),',
    '  "format" (yapı/uzunluk/okunabilirlik sorunu).',
    '- "severity": "critical" (bu olmadan büyük ihtimalle elenirsin), "important"',
    '  (ciddi avantaj/dezavantaj), "minor" (küçük iyileştirme).',
    '- "impact": bu arıza giderilirse hazırlık skoruna eklenmesi beklenen kabaca puan',
    '  (critical için ~15-25, important için ~5-12, minor için ~1-4).',
    '- "diagnosis": arızanın ne olduğu, tek cümle, adaya doğrudan hitap et ("...eksik",',
    '  "...zayıf kalıyor" gibi).',
    '- "fix": ne yapılması gerektiği, tek cümle somut aksiyon.',
    '- "kind": adayın ya sahip olduğu ya olmadığı bir belge/sertifika ise "have_or_not";',
    '  sihirbazın CV içeriğini yeniden yazarak düzeltebileceği bir şeyse "improve".',
    '  (category "document" olanlar genelde "have_or_not", diğerleri genelde "improve".)',
    '- "id": kısa, benzersiz, harf-rakam-tire slug (örn. "is-guvenligi-belgesi").',
    '',
    'CV zaten güçlüyse az sayıda (hatta 0) arıza döndür; sorun uydurma.',
    'Tüm metinlerde ' + TURKISH_WRITING_RULE,
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
    '{"overall_score": <0-100>, "summary": "<1-2 cümle genel teşhis>", "items": [',
    '{"id":"...","category":"...","title":"...","severity":"...","impact":<sayı>,"diagnosis":"...","fix":"...","kind":"..."}]}',
    '',
    `İş ilanı (${job.company_name} - ${job.position_title}):`,
    (job.job_description || 'Açıklama yok').slice(0, 4000),
    '',
    'CV:',
    cvText.slice(0, 8000),
  ].join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = cvDiagnosisSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

const coverLetterSchema = z.object({
  cover_letter: z.string().min(1),
})

export type CoverLetterTone = 'professional' | 'enthusiastic' | 'concise'

export interface CoverLetterResult {
  cover_letter: string
}

/**
 * Writes a Turkish cover letter tailored to a specific job posting, grounded
 * in the candidate's CV. Never invents experience the CV doesn't support.
 */
export async function generateCoverLetter(
  anthropic: Anthropic,
  cvText: string,
  job: { company_name: string; position_title: string; job_description: string | null },
  opts: { tone?: CoverLetterTone; fullName?: string | null } = {}
): Promise<CoverLetterResult> {
  const toneInstruction =
    opts.tone === 'enthusiastic'
      ? 'Üslup: istekli ve enerjik ama abartısız.'
      : opts.tone === 'concise'
        ? 'Üslup: kısa ve öz, en fazla 3 kısa paragraf.'
        : 'Üslup: profesyonel, sıcak ve özgüvenli.'

  const prompt = [
    'Aşağıda bir adayın CV metni ve başvurduğu iş ilanı var. Bu ilana özel,',
    'Türkçe bir ÖN YAZI (cover letter / niyet mektubu) yaz.',
    "- Adayın CV'sindeki gerçek deneyim ve becerilere dayan; SAHİP OLMADIĞI bir şeyi UYDURMA.",
    '- İlandaki en kritik gereksinimlerle adayın en güçlü 2-3 yönünü eşleştir.',
    '- Yapı: giriş (neden bu pozisyon/şirket), gövde (uygunluk kanıtı), kapanış (teşekkür + görüşme isteği).',
    '- Klişe ve yapay zeka kokan kalıplardan kaçın; somut örneklerle yaz.',
    `- ${toneInstruction}`,
    opts.fullName
      ? `- Mektubu "${opts.fullName}" adıyla imzala.`
      : '- İmza satırını "[Adınız Soyadınız]" olarak bırak.',
    '- "Sayın İlgili," veya şirket adıyla uygun bir hitapla başla.',
    '',
    'Yazdığın metinde ' + TURKISH_WRITING_RULE,
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
    '{"cover_letter": "<ön yazı metni; paragraf araları \\n ile>"}',
    '',
    `İş ilanı (${job.company_name} - ${job.position_title}):`,
    (job.job_description || 'Açıklama yok').slice(0, 4000),
    '',
    'CV:',
    cvText.slice(0, 8000),
  ].join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = coverLetterSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

const polishCvSchema = z.object({
  result_text: z.string().min(1),
  notes: z.array(z.string()).max(6).default([]),
})

export type CvPolishMode = 'proofread' | 'shorten'

export interface CvPolishResult {
  result_text: string
  notes: string[]
}

const POLISH_INSTRUCTIONS: Record<CvPolishMode, string> = {
  proofread:
    'CV metnindeki dil bilgisi, yazım, noktalama ve anlatım bozukluklarını düzelt. İÇERİĞİ DEĞİŞTİRME, sadece dili ve akıcılığı iyileştir.',
  shorten:
    'CV metnini özünü koruyarak KISALT: gereksiz tekrarları ve dolgu ifadeleri çıkar, madde işaretlerini sıkılaştır, tek sayfaya yakın derle.',
}

/**
 * Applies a single "polish" operation to the candidate's master CV text:
 * translate (EN/TR), proofread, or shorten. Never adds information the CV
 * doesn't contain; preserves section structure.
 */
export async function polishCv(
  anthropic: Anthropic,
  cvText: string,
  mode: CvPolishMode
): Promise<CvPolishResult> {
  const languageRule = 'Çıktı dilinde ' + TURKISH_WRITING_RULE

  const prompt = [
    'Aşağıda bir adayın CV metni var. Görevin:',
    POLISH_INSTRUCTIONS[mode],
    "- Adayın sahip olmadığı bilgi/deneyimi EKLEME, UYDURMA.",
    "- CV'nin bölüm yapısını ve kronolojisini koru.",
    languageRule,
    'Ayrıca yaptığın belli başlı değişiklikleri 2-4 kısa madde ile özetle (notes).',
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
    '{"result_text": "<işlenmiş CV; satır araları \\n ile>", "notes": ["...", "..."]}',
    '',
    'CV:',
    cvText.slice(0, 10000),
  ]
    .filter(Boolean)
    .join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = polishCvSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

const summaryOptionsSchema = z.object({
  options: z
    .array(
      z.object({
        tone: z.enum(['professional', 'natural']),
        text: z.string().min(1),
      })
    )
    .length(2),
})

export type SummaryTone = 'professional' | 'natural'
export interface SummaryOption {
  tone: SummaryTone
  text: string
}

/**
 * Adayın girdiği CV verisinden profesyonel özet için İKİ seçenek üretir:
 * aynı bilgiler, farklı ton (kurumsal / doğal). Kullanıcı birini seçer.
 *
 * Eskiden burada 16 hazır cümlelik bir liste vardı; herkes aynı cümleleri
 * kullanıyordu ve içerik adayın gerçek deneyimiyle ilgisizdi.
 */
export async function generateSummaryOptions(
  anthropic: Anthropic,
  cvText: string
): Promise<SummaryOption[]> {
  const prompt = [
    'Aşağıda bir adayın CV bilgileri var. Bu bilgilere dayanarak CV’nin en üstünde yer alacak',
    '"profesyonel özet" paragrafı için İKİ FARKLI seçenek yaz.',
    '- Seçenek 1 (professional): kurumsal, ölçülü, işveren diline yakın.',
    '- Seçenek 2 (natural): daha doğal ve insani, birinci ağızdan, samimi ama profesyonel.',
    '- İKİSİ DE AYNI gerçeklere dayansın; yalnızca ton farklı olsun.',
    '- Adayın CV’sinde OLMAYAN deneyim, yıl, şirket, rakam veya beceri UYDURMA.',
    '- Her biri 2-4 cümle, tek paragraf, madde işareti yok.',
    '- CV boşsa veya çok az bilgi varsa genel geçer klişe yazma; eldeki bilgiyle yetin.',
    TURKISH_WRITING_RULE,
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
    '{"options": [{"tone": "professional", "text": "..."}, {"tone": "natural", "text": "..."}]}',
    '',
    'CV:',
    cvText.slice(0, 8000),
  ]
    .filter(Boolean)
    .join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = summaryOptionsSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data.options
}

const skillsGapSchema = z.object({
  matched: z.array(z.string()).max(20).default([]),
  missing: z.array(z.string()).max(20).default([]),
  summary: z.string().min(1),
})

export interface SkillsGapResult {
  matched: string[]
  missing: string[]
  summary: string
}

/**
 * Compares a job posting's required skills against the candidate's CV and
 * returns which skills are covered (matched) and which are missing, plus a
 * short summary. Grounded in CV evidence — no invented matches.
 */
export async function analyzeSkillsGap(
  anthropic: Anthropic,
  cvText: string,
  job: { company_name: string; position_title: string; job_description: string | null }
): Promise<SkillsGapResult> {
  const prompt = [
    'Aşağıda bir adayın CV metni ve başvurduğu iş ilanı var.',
    'İlanın gerektirdiği BECERİ/YETKİNLİKLERİ çıkar ve adayın CV\'siyle karşılaştır.',
    '- "matched": ilanın istediği VE adayın CV\'sinde KANITI olan beceriler.',
    '- "missing": ilanın istediği AMA CV\'de görünmeyen/eksik beceriler.',
    '- Beceri adlarını kısa tut (örn. "React", "Proje Yönetimi", "İngilizce (C1)").',
    '- CV\'de olmayan bir beceriyi "matched" sayma; emin değilsen "missing"e koy.',
    '- Her listede en fazla 12 madde.',
    '- "summary": 1-2 cümlelik genel değerlendirme ve kapatılması en kritik eksik.',
    'Madde adlarında ve özette ' + TURKISH_WRITING_RULE,
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
    '{"matched": ["..."], "missing": ["..."], "summary": "..."}',
    '',
    `İş ilanı (${job.company_name} - ${job.position_title}):`,
    (job.job_description || 'Açıklama yok').slice(0, 4000),
    '',
    'CV:',
    cvText.slice(0, 8000),
  ].join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = skillsGapSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

const salaryCoachSchema = z.object({
  range_low: z.number().min(0),
  range_high: z.number().min(0),
  currency: z.string().min(1).max(8),
  assessment: z.string().min(1),
  counter_offer: z.string().min(1),
  scripts: z
    .array(z.object({ situation: z.string().min(1), message: z.string().min(1) }))
    .max(4),
  tips: z.array(z.string()).max(6),
})

export interface SalaryNegotiationScript {
  situation: string
  message: string
}

export interface SalaryCoachResult {
  /** Tahmini piyasa aralığı alt sınırı (aylık brüt, `currency` cinsinden). */
  range_low: number
  range_high: number
  currency: string
  /** Teklif verildiyse teklifin bu aralığa göre değerlendirmesi; yoksa genel yorum. */
  assessment: string
  /** Önerilen karşı-teklif tutarı/yaklaşımı. */
  counter_offer: string
  /** Hazır müzakere replikleri (durum → söylenecek). */
  scripts: SalaryNegotiationScript[]
  tips: string[]
}

/**
 * Maaş müzakere koçu: pozisyon, şehir ve (varsa) alınan teklif için Türkiye
 * piyasasına göre tahmini aylık brüt maaş aralığı, teklifin değerlendirmesi,
 * karşı-teklif önerisi ve hazır müzakere replikleri üretir. Tahminler kesin
 * değildir; model bunu açıkça belirtir. Uydurma yapmaz.
 */
export async function analyzeSalary(
  anthropic: Anthropic,
  input: {
    company_name: string
    position_title: string
    city: string
    offer?: string | null
    job_description: string | null
    cvText: string | null
  }
): Promise<SalaryCoachResult> {
  const prompt = [
    'Sen deneyimli bir maaş müzakere koçusun. Aşağıdaki pozisyon ve şehir için',
    'TÜRKİYE iş piyasasına göre tahmini AYLIK BRÜT maaş aralığını (TRY) ver ve adayın',
    'pazarlığına yardım et. Tahminlerin kesin olmadığını "assessment" içinde kısaca belirt.',
    '',
    `Şirket: ${input.company_name}`,
    `Pozisyon: ${input.position_title}`,
    `Şehir: ${input.city}`,
    input.offer ? `Adaya yapılan teklif: ${input.offer}` : 'Henüz bir teklif belirtilmedi.',
    input.job_description ? `İlan: ${input.job_description.slice(0, 3000)}` : null,
    input.cvText ? `Adayın CV\'si (deneyim seviyesi için):\n${input.cvText.slice(0, 3000)}` : null,
    '',
    'Kurallar:',
    '- "range_low"/"range_high": aylık brüt TRY tutarları (sayı, sembol/nokta olmadan).',
    '- "currency": "TRY".',
    '- "assessment": teklif verildiyse aralığa göre değerlendir (düşük/piyasa/iyi);',
    '  verilmediyse genel bir yorum yap. Tahminlerin yaklaşık olduğunu belirt. 2-3 cümle.',
    '- "counter_offer": önerilen karşı-teklif tutarı veya net bir yaklaşım.',
    '- "scripts": en fazla 4 hazır müzakere repliği; her biri {situation, message}.',
    '  message = adayın aynen kullanabileceği kibar, özgüvenli Türkçe cümle(ler).',
    '- "tips": en fazla 5 kısa pazarlık ipucu.',
    'Tüm metinlerde ' + TURKISH_WRITING_RULE,
    'SADECE şu JSON ile cevap ver, başka metin ekleme:',
    '{"range_low":<sayı>,"range_high":<sayı>,"currency":"TRY","assessment":"...",',
    '"counter_offer":"...","scripts":[{"situation":"...","message":"..."}],"tips":["..."]}',
  ]
    .filter(Boolean)
    .join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = salaryCoachSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

const competitorSchema = z.object({
  positioning_score: z.number().min(0).max(100),
  summary: z.string().min(1),
  typical_profile: z.array(z.string()).max(8),
  your_standing: z.string().min(1),
  differentiators: z.array(z.string()).max(6),
})

export interface CompetitorAnalysisResult {
  /** Adayın bu ilana karşı rekabetçi konumu (0-100). */
  positioning_score: number
  summary: string
  /** Bu ilana başvuran tipik/rakip adayların özellikleri. */
  typical_profile: string[]
  /** Adayın bu havuzda nerede durduğu (güçlü/zayıf yönler). */
  your_standing: string
  /** Adayın fark yaratmak için öne çıkarması gereken yönler/aksiyonlar. */
  differentiators: string[]
}

/**
 * Rakip analizi: ilana bakarak bu pozisyona başvuran TİPİK aday profilini
 * çıkarır, adayın CV\'siyle karşılaştırarak havuzda nerede durduğunu ve nasıl
 * fark yaratabileceğini analiz eder + rekabetçi konum skoru verir. Adayda
 * olmayan bir şeyi uydurmaz.
 */
export async function analyzeCompetition(
  anthropic: Anthropic,
  input: {
    company_name: string
    position_title: string
    job_description: string | null
    cvText: string | null
  }
): Promise<CompetitorAnalysisResult> {
  const prompt = [
    'Sen bir kariyer stratejistisin. Aşağıdaki iş ilanına başvuran TİPİK aday',
    'profilini (rakipler) çıkar, adayın CV\'siyle karşılaştır ve bu rekabette nerede',
    'durduğunu + nasıl fark yaratabileceğini analiz et.',
    '',
    `Şirket: ${input.company_name}`,
    `Pozisyon: ${input.position_title}`,
    input.job_description ? `İlan: ${input.job_description.slice(0, 3500)}` : null,
    input.cvText ? `Adayın CV\'si:\n${input.cvText.slice(0, 4000)}` : 'Adayın CV\'si yüklenmemiş.',
    '',
    'Kurallar:',
    '- "positioning_score": adayın bu ilana karşı rekabetçi gücü, 0-100.',
    '- "summary": 1-2 cümlelik genel değerlendirme.',
    '- "typical_profile": bu pozisyona başvuran tipik adayların özellikleri (en fazla 8 madde).',
    '- "your_standing": adayın bu havuzda nerede durduğu; güçlü ve zayıf yönleri (2-4 cümle).',
    '- "differentiators": adayın fark yaratmak için yapabileceği somut aksiyonlar (en fazla 6).',
    '- Adayda gerçekte olmayan bir özelliği "var" gibi gösterme.',
    'Tüm metinlerde ' + TURKISH_WRITING_RULE,
    'SADECE şu JSON ile cevap ver, başka metin ekleme:',
    '{"positioning_score":<0-100>,"summary":"...","typical_profile":["..."],',
    '"your_standing":"...","differentiators":["..."]}',
  ]
    .filter(Boolean)
    .join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = competitorSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

const certificateSchema = z.object({
  name: z.string().default(''),
  issuer: z.string().default(''),
  date: z.string().default(''),
  skills: z.array(z.string()).max(12).default([]),
})

export interface CertificateExtraction {
  name: string
  issuer: string
  date: string
  skills: string[]
}

export type CertImageType = 'image/png' | 'image/jpeg' | 'image/webp'

/**
 * Reads an uploaded certificate/diploma and extracts its name, issuer and date,
 * plus any skills it evidences — so the CV builder can auto-fill the entry and
 * merge the skills. Images are read with vision; PDFs are passed as text
 * (extracted upstream) since this SDK version has no document block.
 */
export async function extractCertificate(
  anthropic: Anthropic,
  input: { image?: { data: string; mediaType: CertImageType }; text?: string }
): Promise<CertificateExtraction> {
  const instruction = [
    'Bu bir sertifika, diploma veya katılım belgesidir. İçindeki bilgileri çıkar:',
    '- "name": sertifikanın/eğitimin adı',
    '- "issuer": belgeyi veren kurum/kuruluş',
    '- "date": veriliş/tamamlanma tarihi (yıl ya da AA.YYYY; yoksa boş)',
    '- "skills": belgenin kanıtladığı en fazla 8 ilgili beceri/teknoloji (kısa adlar; yoksa boş liste)',
    'Bir bilgi okunamıyorsa o alanı boş bırak. ' + TURKISH_WRITING_RULE,
    'SADECE şu JSON ile cevap ver, başka metin ekleme:',
    '{"name":"","issuer":"","date":"","skills":[]}',
  ].join('\n')

  const content: Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> = input.image
    ? [
        { type: 'image', source: { type: 'base64', media_type: input.image.mediaType, data: input.image.data } },
        { type: 'text', text: instruction },
      ]
    : [{ type: 'text', text: `${instruction}\n\nSertifika metni:\n${(input.text ?? '').slice(0, 6000)}` }]

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = certificateSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

/**
 * Parses an existing CV (extracted PDF text, or an image read with vision)
 * into the structured CvData shape used by the CV builder, so the user can
 * import a CV they already have and then edit it field-by-field. Content is
 * kept in its original language; nothing is invented. The photo is never
 * filled here (the user adds it in the builder).
 */
export async function parseCvToStructured(
  anthropic: Anthropic,
  input: { image?: { data: string; mediaType: CertImageType }; text?: string }
): Promise<CvData> {
  const instruction = [
    'Bu bir özgeçmiş (CV) belgesidir. İçeriğini AYNEN, yapılandırılmış JSON biçimine dök.',
    '- Bilgiyi olduğu gibi al; yeni bilgi UYDURMA, çeviri YAPMA (özgün dilini koru).',
    '- Bir alan belgede yoksa boş string ("") veya boş liste ([]) bırak.',
    '- Deneyim/eğitimde tarihleri kısa yaz (örn. "2021", "06.2021"). Hâlâ devam eden işte',
    '  "current": true yap ve "end" boş kalsın.',
    '- "bullets": her madde ayrı bir string; başına işaret/• koyma.',
    '- "skills": kısa beceri adları listesi. "links": {label,url} (örn. LinkedIn).',
    '- "photo" alanını her zaman boş ("") bırak.',
    TURKISH_WRITING_RULE,
    'SADECE şu JSON şemasıyla cevap ver, başka hiçbir metin ekleme:',
    '{"personal":{"fullName":"","headline":"","email":"","phone":"","location":"","photo":"","links":[{"label":"","url":""}]},',
    '"summary":"","experience":[{"company":"","role":"","location":"","start":"","end":"","current":false,"bullets":[""]}],',
    '"education":[{"school":"","degree":"","field":"","start":"","end":"","note":""}],"skills":[""],',
    '"projects":[{"name":"","description":"","link":"","bullets":[""]}],"languages":[{"name":"","level":""}],',
    '"certifications":[{"name":"","issuer":"","date":""}]}',
  ].join('\n')

  const content: Array<Anthropic.TextBlockParam | Anthropic.ImageBlockParam> = input.image
    ? [
        { type: 'image', source: { type: 'base64', media_type: input.image.mediaType, data: input.image.data } },
        { type: 'text', text: instruction },
      ]
    : [{ type: 'text', text: `${instruction}\n\nCV metni:\n${(input.text ?? '').slice(0, 12000)}` }]

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = cvDataSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  // Güvenlik: foto bu akışta asla doldurulmaz.
  return { ...validated.data, personal: { ...validated.data.personal, photo: '' } }
}

const cvReviewSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()).max(8).default([]),
  improvements: z
    .array(z.object({ section: z.string().min(1), tip: z.string().min(1) }))
    .max(10)
    .default([]),
})

export interface CvReviewResult {
  score: number
  strengths: string[]
  improvements: { section: string; tip: string }[]
}

/**
 * Audits a CV against professional best practices (photo, 1-2 page length,
 * reverse-chronological order, a clean header with contact + only LinkedIn,
 * measurable bullet-point achievements, objective skills/language/cert
 * listing) and returns a readiness score plus concrete, section-tagged tips.
 */
export async function reviewCvProfessionalism(
  anthropic: Anthropic,
  cvText: string,
  opts: { hasPhoto: boolean }
): Promise<CvReviewResult> {
  const prompt = [
    'Aşağıda bir adayın CV metni var. Bu CV\'yi PROFESYONELLİK ilkelerine göre denetle',
    've geliştirme önerileri ver. Değerlendirme kriterleri:',
    '- Fotoğraf: profesyonel bir vesikalık fotoğraf olmalı (tatil/selfie değil).',
    `  (Bu CV\'de şu an fotoğraf ${opts.hasPhoto ? 'VAR' : 'YOK'}.)`,
    '- Yapı/uzunluk: net, 1-2 sayfa, ters kronolojik (en yeni en üstte).',
    '- Başlık: ad soyad, profesyonel ünvan, e-posta, telefon, konum net olmalı;',
    '  sosyal medyadan yalnızca sektöre uygun LinkedIn olmalı.',
    '- Deneyim: sadece ünvan değil, ÖLÇÜLEBİLİR başarılar/sorumluluklar madde madde.',
    '- Yetkinlik/Dil: sertifikalar, beceriler ve yabancı dil seviyesi objektif listelenmeli.',
    '',
    '0-100 arası bir "profesyonellik skoru" ver. 2-5 güçlü nokta (strengths) ve',
    'eksikler için somut öneriler (improvements) yaz. Her öneride "section" alanına',
    'ilgili bölümü yaz (örn. "Fotoğraf", "Deneyim", "Başlık", "Diller", "Genel").',
    'Var olmayan bilgiyi UYDURMA; yalnızca metinde gördüğüne dayan. ' + TURKISH_WRITING_RULE,
    'SADECE şu JSON ile cevap ver, başka hiçbir metin ekleme:',
    '{"score":<0-100>,"strengths":["..."],"improvements":[{"section":"...","tip":"..."}]}',
    '',
    'CV:',
    cvText.slice(0, 10000),
  ].join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1536,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = cvReviewSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

const jobExtractionSchema = z.object({
  company_name: z.string().default(''),
  position_title: z.string().default(''),
  job_description: z.string().default(''),
})

export interface JobExtraction {
  company_name: string
  position_title: string
  job_description: string
}

/**
 * Reads the raw text of a job posting page and extracts the structured
 * fields the user would otherwise type by hand: company name, position
 * title and a clean job description. Throws on an invalid AI response so
 * callers can fall back to heuristic meta-tag parsing.
 */
export async function extractJobPosting(
  anthropic: Anthropic,
  pageText: string,
  url: string
): Promise<JobExtraction> {
  const prompt = [
    'Aşağıda bir iş ilanı sayfasının ham metni var. Bu metinden ilanın bilgilerini çıkar:',
    '- "company_name": ilanı veren şirketin/kurumun adı',
    '- "position_title": açık pozisyonun/iş ilanının başlığı',
    '- "job_description": ilanın açıklaması; görev tanımı, sorumluluklar, aranan',
    '  nitelikler ve varsa yan haklar gibi ASIL içeriği derli toplu biçimde topla.',
    '  Menü, çerez uyarısı, footer, "benzer ilanlar" gibi sayfa süslerini ALMA.',
    'Bilgi gerçekten yoksa o alanı boş bırak; UYDURMA. ' + TURKISH_WRITING_RULE,
    'SADECE şu JSON ile cevap ver, başka hiçbir metin ekleme:',
    '{"company_name":"","position_title":"","job_description":""}',
    '',
    `İlan adresi: ${url}`,
    '',
    'Sayfa metni:',
    pageText.slice(0, 12000),
  ].join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = jobExtractionSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

const classificationSchema = z.object({
  classification: z.enum(['interview_invitation', 'rejection', 'info_request', 'other']),
  application_id: z.string().uuid().nullable(),
  // OPSİYONEL olmalı: bu şema safeParse ile doğrulanıyor ve başarısızlıkta
  // fonksiyon 'other' fallback'ine düşüyor. Zorunlu yapılırsa, AI alanı atladığı
  // her seferde SINIFLANDIRMANIN TAMAMI çöker.
  interview_date: z.string().nullable().optional().default(null),
})

export interface InboundEmailClassification {
  classification: EmailClassification
  application_id: string | null
  /** Mülakat daveti ise e-postadan çıkarılan tarih (ISO 8601) — yoksa null. */
  interview_date: string | null
}

/**
 * AI'ın döndürdüğü tarihi güvene alır: geçerli bir tarih mi ve makul bir
 * aralıkta mı (geçmiş 1 gün → gelecek 1 yıl). Aksi halde null.
 * Model bazen "önümüzdeki Salı"yı yanlış yıla taşıyabiliyor; saçma tarihi
 * kaydetmektense hiç kaydetmemek iyidir (kullanıcı elle girebilir).
 */
function sanitizeInterviewDate(value: string | null | undefined): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const now = Date.now()
  if (d.getTime() < now - 864e5) return null // 1 günden eski
  if (d.getTime() > now + 365 * 864e5) return null // 1 yıldan uzak
  return d.toISOString()
}

export interface ClassifiableApplication {
  id: string
  company_name: string
  position_title: string
  status: string
}

/**
 * Gelen bir e-postayı sınıflandırır (mülakat daveti / red / bilgi talebi /
 * diğer), hangi başvuruyla ilgili olduğunu bulur ve mülakat davetiyse
 * TARİHİ de çıkarır. AI çağrısı başarısız olursa 'other' + null döner.
 *
 * Tarih çıkarımı neden burada: e-posta gövdesi ve başvuru eşleşmesi zaten
 * bu çağrıda mevcut — ayrı bir AI turu açmak gereksiz maliyet olurdu.
 */
export async function classifyInboundEmail(
  anthropic: Anthropic,
  email: { subject: string; body: string },
  applications: ClassifiableApplication[]
): Promise<InboundEmailClassification> {
  const fallback: InboundEmailClassification = {
    classification: 'other',
    application_id: null,
    interview_date: null,
  }

  const appList = applications
    .map((app) => `- id: ${app.id}, şirket: ${app.company_name}, pozisyon: ${app.position_title}, durum: ${app.status}`)
    .join('\n')

  // Zaman çıpası ŞART: TR e-postaları tarihi göreli/konuşma dilinde yazıyor
  // ("önümüzdeki Salı 14:00", "yarın sabah"). Model "şimdi"nin ne olduğunu
  // bilmeden bunları mutlak tarihe çeviremez.
  const now = new Date()
  const nowStr = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(now)

  // Takvim tablosu: yalnızca "şu an" verilince model gün aritmetiğinde
  // yanılıyordu — 15 Temmuz Çarşamba'da "önümüzdeki Salı" için 21 Temmuz Salı
  // yerine 22 Temmuz Çarşamba (= +7 gün, aynı gün) döndürdü. Önümüzdeki 21
  // günün tarih↔gün eşlemesini vererek aritmetiği ARAMAYA çeviriyoruz.
  const dayFmt = new Intl.DateTimeFormat('tr-TR', { timeZone: 'Europe/Istanbul', weekday: 'long' })
  const calendar = Array.from({ length: 21 }, (_, i) => {
    const d = new Date(now.getTime() + (i + 1) * 864e5)
    const iso = d.toISOString().slice(0, 10)
    return `  ${iso} = ${dayFmt.format(d)}${i === 0 ? ' (yarın)' : ''}`
  }).join('\n')

  const prompt = [
    'Aşağıda bir kullanıcının iş başvuru sürecinde aldığı bir e-posta var.',
    'Bu e-postayı şu kategorilerden birine sınıflandır:',
    '- "interview_invitation": mülakata davet ediliyor',
    '- "rejection": başvuru reddedildi',
    '- "info_request": ek bilgi/belge isteniyor',
    '- "other": yukarıdakilerden hiçbiri',
    '',
    'Ayrıca, aşağıdaki başvuru listesinden bu e-postanın hangisiyle ilgili olduğunu bul (varsa id\'sini ver, yoksa null).',
    '',
    'MÜLAKAT TARİHİ (interview_date):',
    `- Şu an: ${nowStr} (Türkiye saati, Europe/Istanbul, UTC+03:00).`,
    '- Önümüzdeki günlerin takvimi (gün adını BURADAN oku, kendin hesaplama):',
    calendar,
    '- E-postada mülakat için bir tarih/saat geçiyorsa ISO 8601 olarak ver:',
    '  "2026-07-21T14:00:00+03:00" gibi (saat dilimi offset\'i DAHİL).',
    '- Göreli ifadeler ("önümüzdeki Salı", "yarın 14:00", "3 gün sonra") için',
    '  yukarıdaki takvimden EŞLEŞEN GÜN ADINI bul ve o tarihi kullan.',
    '  Örnek: "önümüzdeki Salı" → takvimdeki İLK "Salı" satırının tarihi.',
    '- Saat belirtilmemişse o günü 10:00 kabul et.',
    '- Tarih yoksa, belirsizse ("uygun olduğunuz bir zaman") ya da e-posta',
    '  mülakat daveti DEĞİLSE: null ver. UYDURMA.',
    '',
    'Başvurular:',
    appList || '(başvuru yok)',
    '',
    `E-posta konusu: ${email.subject}`,
    `E-posta içeriği: ${email.body.slice(0, 4000)}`,
    '',
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
    '{"classification": "<kategori>", "application_id": "<uuid veya null>", "interview_date": "<ISO 8601 veya null>"}',
  ].join('\n')

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 320,
      messages: [{ role: 'user', content: prompt }],
    })
    const textBlock = response.content.find((block) => block.type === 'text')
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    const validated = classificationSchema.safeParse(candidate)
    if (!validated.success) return fallback
    const { classification, application_id } = validated.data
    return {
      classification,
      application_id,
      // Tarih yalnızca gerçekten mülakat davetiyse anlamlı; model başka
      // kategorilerde de tarih döndürebiliyor (ör. red mailindeki bir tarih).
      interview_date:
        classification === 'interview_invitation'
          ? sanitizeInterviewDate(validated.data.interview_date)
          : null,
    }
  } catch {
    return fallback
  }
}

const mockInterviewTurnSchema = z.object({
  message: z.string().min(1),
  is_final: z.boolean(),
})

export interface MockInterviewTurnResult {
  message: string
  is_final: boolean
}

export interface MockInterviewHistoryEntry {
  role: 'interviewer' | 'candidate'
  content: string
}

/**
 * Generates the next turn of a mock interview: either the next interview
 * question, or (once questionNumber exceeds totalQuestions) a short closing
 * remark with is_final: true.
 */
export async function generateMockInterviewTurn(
  anthropic: Anthropic,
  params: {
    job: { company_name: string; position_title: string; job_description: string | null }
    cvText: string | null
    requiredDocuments: RequiredDocument[]
    history: MockInterviewHistoryEntry[]
    questionNumber: number
    totalQuestions: number
    language?: string | null
  }
): Promise<MockInterviewTurnResult> {
  const { job, cvText, requiredDocuments, history, questionNumber, totalQuestions, language } = params

  const documentLines = requiredDocuments.map((doc) => {
    const status = doc.has === true ? 'VAR' : doc.has === false ? 'YOK' : 'BELİRTİLMEDİ'
    return `- ${doc.name} (önem: ${doc.importance}, durum: ${status})`
  })

  const isFinalTurn = questionNumber > totalQuestions

  const systemPrompt = [
    `Sen ${job.company_name} firmasında ${job.position_title} pozisyonu için mülakat`,
    'yapan deneyimli bir İK/teknik mülakat uzmanısın. Adayın CV\'si, ilan açıklaması ve',
    'sektöre özel beklenen belgeler aşağıda.',
    `Toplam ${totalQuestions} sorudan oluşan bir mülakat yapıyorsun, şu an`,
    `${Math.min(questionNumber, totalQuestions)}. sorudasın.`,
    '',
    isFinalTurn
      ? 'Tüm sorular soruldu. Soru SORMA; adaya kısa, sıcak bir kapanış/teşekkür mesajı yaz' +
        ' ve mülakatın bittiğini belirt.'
      : [
          'Sırada olduğun soru numarasına göre uygun bir mülakat sorusu sor:',
          '- 1. soru: kısa bir tanışma/icebreaker sorusu (örn. "Kendinizden ve bu pozisyona',
          '  neden başvurduğunuzdan bahseder misiniz?").',
          `- Ortadaki sorular (2 - ${Math.max(totalQuestions - 1, 2)}): davranışsal (STAR`,
          '  yöntemiyle cevaplanabilecek) ve ilan açıklamasına, CV\'ye ve sektöre özel',
          '  belgelere göre role özel teknik/durumsal sorular.',
          `- Son soru (${totalQuestions}. soru): şirket/motivasyon odaklı bir soru veya`,
          '  adaya "sizin de bize sormak istediğiniz bir şey var mı?" gibi bir kapanış sorusu.',
          '',
          'Önceki sorularla konu tekrarı yapma; aşağıdaki geçmişi kontrol et.',
          '',
          'Adayın önceki cevaplarının üslubunu değerlendir: cevaplar kısa, yüzeysel',
          'veya kararsız görünüyorsa bir sonraki soruyu daha zorlayıcı, somut örnek',
          've detay isteyen bir takip sorusu olarak sor. Cevaplar net, özgüvenli ve',
          'detaylıysa normal akışa devam edebilir veya daha ileri seviye bir konuya',
          'geçebilirsin.',
          '',
          'SADECE bir soru sor, başka açıklama ekleme.',
        ].join('\n'),
    '',
    'CV:',
    (cvText || 'CV yüklenmemiş.').slice(0, 4000),
    '',
    'İlan açıklaması:',
    (job.job_description || 'Açıklama yok').slice(0, 4000),
    '',
    'Sektöre özel beklenen belgeler:',
    documentLines.length > 0 ? documentLines.join('\n') : '(bu ilan için ek belge belirtilmemiş)',
    '',
    interviewLanguageRule(language),
    '',
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme (JSON anahtarları İngilizce kalsın, sadece "message" değeri istenen dilde olsun):',
    `{"message": "<soru veya kapanış mesajı>", "is_final": ${isFinalTurn ? 'true' : 'false'}}`,
  ].join('\n')

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: 'Mülakatı başlat.' }]
  for (const entry of history) {
    messages.push({
      role: entry.role === 'interviewer' ? 'assistant' : 'user',
      content: entry.content,
    })
  }

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = mockInterviewTurnSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

const mockInterviewFeedbackSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string()).min(1).max(5),
  improvements: z.array(z.string()).min(1).max(5),
  category_scores: z
    .array(
      z.object({
        category: z.string().min(1),
        score: z.number().min(0).max(100),
        comment: z.string().min(1),
      })
    )
    .min(1)
    .max(6),
  overall_score: z.number().min(0).max(100),
})

export interface MockInterviewFeedback {
  summary: string
  strengths: string[]
  improvements: string[]
  category_scores: { category: string; score: number; comment: string }[]
  overall_score: number
}

/**
 * Evaluates a completed (or partially completed) mock interview transcript
 * and returns structured feedback: an overall score, category breakdowns,
 * strengths and areas to improve.
 */
export async function generateMockInterviewFeedback(
  anthropic: Anthropic,
  params: {
    job: { company_name: string; position_title: string; job_description: string | null }
    cvText: string | null
    transcript: MockInterviewHistoryEntry[]
    language?: string | null
  }
): Promise<MockInterviewFeedback> {
  const { job, cvText, transcript, language } = params

  const transcriptLines = transcript.map((entry) =>
    entry.role === 'interviewer' ? `Mülakatçı: ${entry.content}` : `Aday: ${entry.content}`
  )

  const prompt = [
    `Aşağıda ${job.company_name} firmasında ${job.position_title} pozisyonu için yapılan`,
    'bir mock mülakatın dökümü var. Adayın performansını değerlendir.',
    '',
    'Şu kategorileri kullanarak değerlendir (4-6 kategori arası seçebilirsin, önerilenler):',
    '- "İletişim & Açıklık"',
    '- "Yapılandırma (STAR yöntemi)"',
    '- "Teknik/Role Özel Bilgi"',
    '- "Motivasyon & Şirket Uyumu"',
    'Her kategori için 0-100 arası bir puan ve kısa bir yorum ver.',
    '',
    'Ayrıca genel bir mülakat performans skoru (0-100), 3-5 güçlü nokta,',
    '3-5 geliştirilmesi gereken nokta ve genel bir değerlendirme özeti yaz.',
    '',
    interviewLanguageRule(language),
    '',
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
    '{"summary": "...", "strengths": ["...","..."], "improvements": ["...","..."],',
    '"category_scores": [{"category":"...","score":<0-100>,"comment":"..."}],',
    '"overall_score": <0-100 arası sayı>}',
    '',
    'CV:',
    (cvText || 'CV yüklenmemiş.').slice(0, 4000),
    '',
    'İlan açıklaması:',
    (job.job_description || 'Açıklama yok').slice(0, 4000),
    '',
    'Mülakat dökümü:',
    transcriptLines.join('\n'),
  ].join('\n')

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
  const validated = mockInterviewFeedbackSchema.safeParse(candidate)
  if (!validated.success) throw new Error('invalid AI response shape')
  return validated.data
}

export { MOCK_INTERVIEW_QUESTION_COUNT }
