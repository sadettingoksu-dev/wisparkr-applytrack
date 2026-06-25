import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndIncrementUsage } from '@/lib/usage'
import { getAnthropicClient, extractCertificate, type CertImageType } from '@/lib/anthropic'
import { extractPdfText } from '@/lib/pdf'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'] as const
type Accepted = (typeof ACCEPTED)[number]

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
  const { userId, profile } = ctx

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: { code: 'INVALID_FILE', message: 'Sertifika dosyası bulunamadı.' } },
      { status: 400 }
    )
  }
  if (!ACCEPTED.includes(file.type as Accepted)) {
    return NextResponse.json(
      { error: { code: 'INVALID_FILE_TYPE', message: 'Sadece PDF, PNG, JPG veya WEBP kabul edilir.' } },
      { status: 400 }
    )
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: { code: 'FILE_TOO_LARGE', message: "Dosya boyutu 5MB'ı aşamaz." } },
      { status: 400 }
    )
  }

  // AI kullanımını ölç (deneme/Pro aylık AI kotasına dahil).
  const admin = createAdminClient()
  const usage = await checkAndIncrementUsage(admin, userId, profile.plan, 'ai_question')
  if (!usage.allowed) {
    return NextResponse.json(
      { error: { code: 'USAGE_LIMIT_REACHED', message: `Bu ay için AI kullanım limitine (${usage.limit}) ulaştınız. Plan yükseltin.` } },
      { status: 403 }
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  let result
  try {
    if (file.type === 'application/pdf') {
      const text = await extractPdfText(buffer)
      if (!text.trim()) {
        return NextResponse.json(
          { error: { code: 'EMPTY_PDF', message: 'PDF metni okunamadı; görüntü (PNG/JPG) olarak yüklemeyi dene.' } },
          { status: 400 }
        )
      }
      result = await extractCertificate(anthropic, { text })
    } else {
      result = await extractCertificate(anthropic, {
        image: { data: buffer.toString('base64'), mediaType: file.type as CertImageType },
      })
    }
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'Sertifika okunamadı, daha net bir dosya ile tekrar dene.' } },
      { status: 502 }
    )
  }

  return NextResponse.json({ data: result })
}
