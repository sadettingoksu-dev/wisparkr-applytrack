import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import type { EmailClassification } from '@/lib/types'

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

/**
 * Rewrites a candidate's CV text to better match a specific job posting,
 * and scores how application-ready the tailored CV is (0-100).
 */
export async function tailorCv(
  anthropic: Anthropic,
  cvText: string,
  job: { company_name: string; position_title: string; job_description: string | null }
): Promise<TailorCvResult> {
  const prompt = [
    'Aşağıda bir adayın CV metni ve başvurduğu iş ilanının açıklaması var.',
    'CV\'yi bu ilana göre yeniden düzenle: ilanla en alakalı deneyim/becerileri öne çıkar,',
    'ilandaki anahtar kelimelere uygun şekilde ifade et, gereksiz/ilgisiz kısımları kısalt.',
    'Adayın gerçekte sahip olmadığı bir beceri veya deneyimi EKLEME, UYDURMA.',
    'CV\'nin genel yapısını (bölümler, kronoloji) koru, sadece içeriği güçlendir.',
    'Ardından, yeniden düzenlenmiş CV\'nin bu ilana ne kadar hazır olduğunu 0-100 arası',
    'bir "başvuru hazırlık skoru" ile değerlendir ve adayın CV dışında yapabileceği',
    '(örn. eksik bir sertifika, deneyim alanı) tam olarak 3 somut öneri ver.',
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
