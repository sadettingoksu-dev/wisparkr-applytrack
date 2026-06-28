import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { rateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/rateLimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndIncrementUsage } from '@/lib/usage'
import { getAnthropicClient, generateCoverLetter, type CoverLetterTone } from '@/lib/anthropic'
import { getPlan } from '@/lib/plans'
import type { Application } from '@/lib/types'

const bodySchema = z.object({
  application_id: z.string().uuid(),
  tone: z.enum(['professional', 'enthusiastic', 'concise']).optional(),
})

export async function POST(request: Request) {
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
  const { supabase, userId, profile } = ctx

  const plan = getPlan(profile.plan)
  if (!plan.features.coverLetter) {
    return NextResponse.json(
      {
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: 'AI ön yazı bu planda mevcut değil. Pro veya Career Coach plana geçin.',
        },
      },
      { status: 403 }
    )
  }

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }
  const { application_id, tone } = parsed.data

  if (!profile.cv_text) {
    return NextResponse.json(
      { error: { code: 'NO_CV_UPLOADED', message: 'Önce bir CV yüklemelisiniz.' } },
      { status: 400 }
    )
  }

  const { data: applicationData, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', application_id)
    .eq('user_id', userId)
    .single()
  const application = applicationData as Application | null

  if (appError || !application) {
    return NextResponse.json(
      { error: { code: 'APPLICATION_NOT_FOUND', message: 'Başvuru bulunamadı.' } },
      { status: 404 }
    )
  }

  const admin = createAdminClient()
  const usage = await checkAndIncrementUsage(admin, userId, profile.plan, 'cover_letter')
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
    result = await generateCoverLetter(
      anthropic,
      profile.cv_text,
      {
        company_name: application.company_name,
        position_title: application.position_title,
        job_description: application.job_description,
      },
      { tone: tone as CoverLetterTone | undefined, fullName: profile.full_name }
    )
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'Ön yazı oluşturulamadı.' } },
      { status: 502 }
    )
  }

  await supabase
    .from('applications')
    .update({ cover_letter_text: result.cover_letter } as never)
    .eq('id', application_id)
    .eq('user_id', userId)

  return NextResponse.json({ data: { cover_letter: result.cover_letter } })
}
