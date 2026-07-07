import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { rateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/rateLimit'
import { getAnthropicClient, diagnoseCv } from '@/lib/anthropic'
import type { Application } from '@/lib/types'

const bodySchema = z.object({
  application_id: z.string().uuid(),
})

// CV araba-tamiri sihirbazinin "teshis" adimi. Karar geregi teshis TUM planlara
// BEDAVA'dir (kredi/aylik kota harcamaz); yalnizca AI rate limit ile korunur.
// Optimize CV uretimi (finalize) mevcut /api/ai/tailor-cv uzerinden krediyi harcar.
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

  if (!profile.cv_text) {
    return NextResponse.json(
      { error: { code: 'NO_CV_UPLOADED', message: 'Önce bir CV yüklemelisiniz.' } },
      { status: 400 }
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

  let diagnosis
  try {
    diagnosis = await diagnoseCv(anthropic, profile.cv_text, {
      company_name: application.company_name,
      position_title: application.position_title,
      job_description: application.job_description,
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'CV teşhisi yapılamadı.' } },
      { status: 502 }
    )
  }

  await supabase
    .from('applications')
    .update({ cv_diagnosis: diagnosis } as never)
    .eq('id', application_id)
    .eq('user_id', userId)

  return NextResponse.json({ data: { diagnosis } })
}
