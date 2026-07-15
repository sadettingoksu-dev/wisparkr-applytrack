import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { rateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/rateLimit'
import { getAnthropicClient, DEFAULT_MODEL, TURKISH_WRITING_RULE } from '@/lib/anthropic'
import { LOCALES, type Locale } from '@/lib/i18n'
import { APP_NAME } from '@/utils/constants'

// Yanıt dili — kullanıcının seçili arayüz diline göre.
const LANG_NAMES: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch (Almanca)',
  es: 'Español (İspanyolca)',
  fr: 'Français (Fransızca)',
}

// parkrcan — uygulama içi yönlendirme asistanı. Kullanıcının ne yapmak
// istediğini anlar, kısa Türkçe yanıt verir ve onu doğru sayfaya yönlendiren
// link(ler) döndürür. Ücretsiz bir gezinme yardımcısıdır: plan kapısı yok,
// AI soru kotası tüketmez; yalnızca giriş + rate limit.

const bodySchema = z.object({
  message: z.string().min(1).max(1000),
  locale: z.enum(LOCALES).optional(),
})

const linkSchema = z.object({
  label: z.string().min(1).max(48),
  href: z.string().min(1).max(120),
})
const replySchema = z.object({
  reply: z.string().min(1).max(2000),
  links: z.array(linkSchema).max(3).default([]),
})

// parkrcan'ın yönlendirebileceği sayfalar (tek doğruluk kaynağı). Yanıttaki
// link'ler yalnızca bu listedeki yollara işaret edebilir (güvenlik).
const ROUTES: { href: string; desc: string }[] = [
  { href: '/dashboard', desc: 'Genel bakış: başvuru sayıların, dönüşüm oranların, son hareketler ve özet.' },
  { href: '/applications', desc: 'Başvurular: ilan linki yapıştırarak yeni başvuru ekleme, liste, detay ve notlar.' },
  { href: '/applications?view=board', desc: 'Kanban panosu (Başvurular sayfasının "Pano" görünümü): başvuruları Bekliyor / Mülakat / Teklif / Reddedildi sütunlarında sürükle-bırak ile yönetme.' },
  { href: '/calendar', desc: 'Takvim: mülakat ve takip tarihlerini görme/planlama.' },
  { href: '/analytics', desc: 'Analizler: başvuru istatistikleri ve grafikler.' },
  { href: '/compare', desc: 'Karşılaştırma: başvuruları/ilanları yan yana karşılaştırma.' },
  { href: '/cv-builder', desc: 'CV Oluştur: adım adım CV hazırlama, şablon seçme, PDF indirme ve paylaşılabilir link oluşturma.' },
  { href: '/documents', desc: 'Belgelerim: yüklenen CV ve diğer belgeler.' },
  { href: '/mock-interview', desc: 'AI Mülakat: yapay zeka ile mülakat provası yapma.' },
  { href: '/settings', desc: 'Ayarlar: profil ve hesap ayarları.' },
  { href: '/settings/billing', desc: 'Abonelik & Fatura: planı görme ve yükseltme.' },
  { href: '/pricing', desc: 'Fiyatlandırma: planları ve özellikleri inceleme.' },
]

function isAllowedHref(href: string): boolean {
  return ROUTES.some((r) => href === r.href || href.startsWith(r.href + '?') || href.startsWith(r.href + '/'))
}

export async function POST(request: Request) {
  const anthropic = getAnthropicClient()
  if (!anthropic) {
    return NextResponse.json(
      { error: { code: 'AI_NOT_CONFIGURED', message: 'AI özellikleri henüz yapılandırılmadı (ANTHROPIC_API_KEY eksik).' } },
      { status: 503 }
    )
  }

  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx

  const rl = rateLimit('parkrcan:' + ctx.userId, AI_RATE_LIMIT)
  if (!rl.allowed) return rateLimitResponse(rl)

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }
  const { message, locale } = parsed.data
  const lang = LANG_NAMES[locale ?? 'tr']

  const systemPrompt = [
    `Sen "parkrcan"sın: ${APP_NAME} uygulamasının sevimli, samimi ve yardımsever yapay zeka rehberisin.`,
    `Ürünün adı ${APP_NAME}'dır; başka bir ürün adı asla kullanma.`,
    'Görevin: kullanıcının ne yapmak istediğini anlamak, kısa ve net biçimde nasıl yapacağını anlatmak',
    've onu uygulama içinde DOĞRU sayfaya yönlendirmek.',
    '',
    'Yönlendirebileceğin sayfalar (yalnızca bu yollar kullanılabilir):',
    ...ROUTES.map((r) => `- ${r.href} → ${r.desc}`),
    '',
    'Kurallar:',
    `- TÜM çıktıyı (hem "reply" hem link "label" değerleri) ${lang} dilinde yaz. Kullanıcı hangi dili seçtiyse o dilde yanıtla.`,
    '- Yanıt 1-3 cümle, sıcak ve aksiyon odaklı olsun.',
    '- Kullanıcının isteğine en uygun sayfa(ları) "links" olarak ver (en fazla 3, en alakalısı ilk sırada).',
    '- href MUTLAKA yukarıdaki listeden olmalı; uydurma yol verme.',
    '- İstek uygulamayla ilgisizse kibarca yalnızca uygulama içi konularda yardımcı olabileceğini söyle ve links\'i boş bırak.',
    locale === 'tr' || !locale ? `- ${TURKISH_WRITING_RULE}` : null,
    '',
    'SADECE şu JSON formatında yanıt ver, başka hiçbir metin yazma:',
    '{"reply": "...", "links": [{"label": "Sayfa adı", "href": "/yol"}]}',
  ]
    .filter(Boolean)
    .join('\n')

  let raw: string
  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 700,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    })
    const textBlock = response.content.find((block) => block.type === 'text')
    raw = textBlock && textBlock.type === 'text' ? textBlock.text : ''
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'AI isteği başarısız oldu.' } },
      { status: 502 }
    )
  }

  const match = raw.match(/\{[\s\S]*\}/)
  const result = match ? replySchema.safeParse(safeJson(match[0])) : null
  if (!result || !result.success) {
    return NextResponse.json(
      { error: { code: 'AI_BAD_SHAPE', message: 'invalid AI response shape' } },
      { status: 502 }
    )
  }

  // Güvenlik: yalnızca izin verilen iç yollara işaret eden link'leri geçir.
  const links = result.data.links.filter((l) => l.href.startsWith('/') && isAllowedHref(l.href))

  return NextResponse.json({ data: { reply: result.data.reply, links } })
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}
