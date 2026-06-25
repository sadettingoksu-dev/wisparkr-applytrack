import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndIncrementUsage } from '@/lib/usage'
import { getAnthropicClient, reviewCvProfessionalism } from '@/lib/anthropic'
import { parseCvData, flattenCvData, hasCvContent } from '@/lib/cv'

export const runtime = 'nodejs'

export async function POST() {
  const anthropic = getAnthropicClient()
  if (!anthropic) {
    return NextResponse.json(
      {
        error: {
          code: 'AI_NOT_CONFIGURED',
          message: 'AI özellikleri henüz yapılandırılmadı (ANTHROPIC_API_KEY eksik).',
        },
      },
      { status: 503 }
    )
  }

  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { userId, profile } = ctx

  const data = parseCvData(profile.cv_data)
  if (!hasCvContent(data)) {
    return NextResponse.json(
      { error: { code: 'NO_CV', message: "Önce CV oluşturucudan CV'ni doldur." } },
      { status: 400 }
    )
  }

  // AI kullanımını ölç (deneme/Pro aylık AI kotasına dahil).
  const admin = createAdminClient()
  const usage = await checkAndIncrementUsage(admin, userId, profile.plan, 'ai_question')
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: {
          code: 'USAGE_LIMIT_REACHED',
          message: `Bu ay için AI kullanım limitine (${usage.limit}) ulaştınız. Plan yükseltin.`,
        },
      },
      { status: 403 }
    )
  }

  let result
  try {
    result = await reviewCvProfessionalism(anthropic, flattenCvData(data), {
      hasPhoto: Boolean(data.personal.photo),
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'CV denetimi yapılamadı, tekrar dene.' } },
      { status: 502 }
    )
  }

  return NextResponse.json({ data: result })
}
