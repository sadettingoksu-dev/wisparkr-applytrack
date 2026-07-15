import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { rateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/rateLimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndIncrementUsage } from '@/lib/usage'
import { getAnthropicClient, generateSummaryOptions } from '@/lib/anthropic'
import { parseCvData, flattenCvData, hasCvContent } from '@/lib/cv'

export const runtime = 'nodejs'

/**
 * Profesyonel özet için iki seçenek üretir (kurumsal / doğal).
 *
 * Plan kilidi YOK: CV Oluşturucu çekirdek akış ve free kullanıcı da CV'sini
 * bitirebilmeli. Maliyet, kardeş rota /api/cv/review gibi aylık ortak AI
 * havuzundan sayaçlanır.
 */
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

  const rl = rateLimit('ai:' + ctx.userId, AI_RATE_LIMIT)
  if (!rl.allowed) return rateLimitResponse(rl)
  const { userId, profile } = ctx

  // Özet, kullanıcının girdiği veriden türetilir → önce veri olmalı.
  const data = parseCvData(profile.cv_data)
  if (!hasCvContent(data)) {
    return NextResponse.json(
      { error: { code: 'NO_CV', message: 'Önce CV bilgilerini doldur; özet onlardan üretilir.' } },
      { status: 400 }
    )
  }

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

  let options
  try {
    options = await generateSummaryOptions(anthropic, flattenCvData(data))
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'Özet üretilemedi, tekrar dene.' } },
      { status: 502 }
    )
  }

  return NextResponse.json({ data: { options } })
}
