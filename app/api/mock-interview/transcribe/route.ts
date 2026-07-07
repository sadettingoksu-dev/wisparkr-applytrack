import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { rateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/rateLimit'
import { getPlan } from '@/lib/plans'
import { getSttConfig, transcribeAudio } from '@/lib/stt'
import { getServerLocale } from '@/lib/i18n-server'

// Node runtime: FormData/Blob ile ses dosyasini STT saglayicisina iletir.
export const runtime = 'nodejs'

// Mülakat sesli cevabını sunucuda yazıya çevirir (Google konuşma API'sine
// bağımlı olmadan; her tarayıcıda çalışır). Pro'ya özel + rate limit.
export async function POST(request: Request) {
  const cfg = getSttConfig()
  if (!cfg) {
    return NextResponse.json(
      {
        error: {
          code: 'STT_NOT_CONFIGURED',
          message: 'Sesli yazıya çevirme henüz yapılandırılmadı (GROQ_API_KEY/OPENAI_API_KEY eksik).',
        },
      },
      { status: 503 }
    )
  }

  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx

  const rl = rateLimit('stt:' + ctx.userId, AI_RATE_LIMIT)
  if (!rl.allowed) return rateLimitResponse(rl)

  if (!getPlan(ctx.profile.plan).features.mockInterview) {
    return NextResponse.json(
      { error: { code: 'FEATURE_NOT_AVAILABLE', message: 'Bu özellik yalnızca Pro planında mevcut.' } },
      { status: 403 }
    )
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Ses verisi okunamadı.' } },
      { status: 400 }
    )
  }

  const file = form.get('audio')
  if (!(file instanceof Blob)) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Ses dosyası eksik.' } },
      { status: 400 }
    )
  }
  // Aşırı büyük yüklemeyi reddet (~15 MB ≈ birkaç dakika ses).
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json(
      { error: { code: 'FILE_TOO_LARGE', message: 'Ses kaydı çok uzun.' } },
      { status: 413 }
    )
  }
  if (file.size < 1024) {
    // Neredeyse boş kayıt → boş metin döndür (kullanıcı tekrar denesin).
    return NextResponse.json({ data: { text: '' } })
  }

  const lang = ((form.get('lang') as string) || getServerLocale() || 'tr').slice(0, 5)

  let text: string
  try {
    text = await transcribeAudio(file, 'answer.webm', lang, cfg)
  } catch {
    return NextResponse.json(
      { error: { code: 'STT_FAILED', message: 'Ses yazıya çevrilemedi.' } },
      { status: 502 }
    )
  }

  return NextResponse.json({ data: { text } })
}
