import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndIncrementUsage } from '@/lib/usage'
import { getAnthropicClient, tailorCv } from '@/lib/anthropic'
import { getPlan } from '@/lib/plans'
import type { Application } from '@/lib/types'

const bodySchema = z.object({
  application_id: z.string().uuid(),
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
  const { supabase, userId, profile } = ctx

  const plan = getPlan(profile.plan)
  if (!plan.features.cvAutoTailoring) {
    return NextResponse.json(
      {
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: 'CV optimizasyonu bu planda mevcut değil. Pro veya Career Coach plana geçin.',
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
  const { application_id } = parsed.data

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
  const usage = await checkAndIncrementUsage(admin, userId, profile.plan, 'cv_tailor')
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
    result = await tailorCv(anthropic, profile.cv_text, {
      company_name: application.company_name,
      position_title: application.position_title,
      job_description: application.job_description,
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'CV optimize edilemedi.' } },
      { status: 502 }
    )
  }

  await supabase
    .from('applications')
    .update({
      tailored_cv_text: result.tailored_cv,
      tailored_fit_score: result.score,
    } as never)
    .eq('id', application_id)
    .eq('user_id', userId)

  return NextResponse.json({
    data: { tailored_cv: result.tailored_cv, score: result.score, suggestions: result.suggestions },
  })
}
