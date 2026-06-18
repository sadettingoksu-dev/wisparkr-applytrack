import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { EmailClassification } from '@/lib/types'
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

export type CvPolishMode = 'translate_en' | 'translate_tr' | 'proofread' | 'shorten'

export interface CvPolishResult {
  result_text: string
  notes: string[]
}

const POLISH_INSTRUCTIONS: Record<CvPolishMode, string> = {
  translate_en:
    "CV metnini akıcı, profesyonel İŞ İNGİLİZCESİNE çevir. Anlamı koru; tarih ve biçimleri hedef dile uygun yerelleştir.",
  translate_tr: 'CV metnini akıcı, profesyonel TÜRKÇEYE çevir. Anlamı ve terimleri koru.',
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
  const languageRule = mode === 'translate_en' ? '' : 'Çıktı dilinde ' + TURKISH_WRITING_RULE

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

const classificationSchema = z.object({
  classification: z.enum(['interview_invitation', 'rejection', 'info_request', 'other']),
  application_id: z.string().uuid().nullable(),
})

export interface InboundEmailClassification {
  classification: EmailClassification
  application_id: string | null
}

export interface ClassifiableApplication {
  id: string
  company_name: string
  position_title: string
  status: string
}

/**
 * Gelen bir e-postayı sınıflandırır (mülakat daveti / red / bilgi talebi /
 * diğer) ve kullanıcının açık başvurularından hangisiyle ilgili olduğunu
 * (varsa) belirler. AI çağrısı başarısız olursa 'other' + null döner.
 */
export async function classifyInboundEmail(
  anthropic: Anthropic,
  email: { subject: string; body: string },
  applications: ClassifiableApplication[]
): Promise<InboundEmailClassification> {
  const fallback: InboundEmailClassification = { classification: 'other', application_id: null }

  const appList = applications
    .map((app) => `- id: ${app.id}, şirket: ${app.company_name}, pozisyon: ${app.position_title}, durum: ${app.status}`)
    .join('\n')

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
    'Başvurular:',
    appList || '(başvuru yok)',
    '',
    `E-posta konusu: ${email.subject}`,
    `E-posta içeriği: ${email.body.slice(0, 4000)}`,
    '',
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
    '{"classification": "<kategori>", "application_id": "<uuid veya null>"}',
  ].join('\n')

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })
    const textBlock = response.content.find((block) => block.type === 'text')
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    const validated = classificationSchema.safeParse(candidate)
    if (!validated.success) return fallback
    return validated.data
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
  }
): Promise<MockInterviewTurnResult> {
  const { job, cvText, requiredDocuments, history, questionNumber, totalQuestions } = params

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
    TURKISH_WRITING_RULE,
    '',
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
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
  }
): Promise<MockInterviewFeedback> {
  const { job, cvText, transcript } = params

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
    TURKISH_WRITING_RULE,
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
