import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { rateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/rateLimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndIncrementUsage, consumeFreeCvCredit, refundFreeCvCredit } from '@/lib/usage'
import { getAnthropicClient, tailorCv } from '@/lib/anthropic'
import { getPlan } from '@/lib/plans'
import type { Application, RequiredDocument } from '@/lib/types'

const bodySchema = z.object({
  application_id: z.string().uuid(),
  documents: z
    .array(
      z.object({
        name: z.string().min(1),
        importance: z.enum(['critical', 'important', 'optional']),
        has: z.boolean().nullable(),
      })
    )
    .optional(),
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

  // Pro/deneme (efektif plan) → sınırsız uyarlama. Ücretsiz tier → ömür boyu
  // 1 kredi (free_cv_credits) üzerinden; kredi bitince kilitlenir.
  const plan = getPlan(profile.plan)
  const isFreeTier = !plan.features.cvAutoTailoring

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }
  const { application_id, documents } = parsed.data

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

  // Kredi/kota tüketimi başvuru doğrulandıktan SONRA — geçersiz istekte hak yanmaz.
  const admin = createAdminClient()
  let freeCreditConsumed = false
  if (isFreeTier) {
    const credit = await consumeFreeCvCredit(admin, userId)
    if (!credit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: 'FREE_CV_CREDIT_EXHAUSTED',
            message:
              'Ücretsiz CV uyarlama hakkını kullandın. Sınırsız uyarlama ve paylaşılabilir link için Pro\'ya geç.',
          },
        },
        { status: 403 }
      )
    }
    freeCreditConsumed = true
  } else {
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
  }

  const existingDocuments = Array.isArray(application.required_documents)
    ? (application.required_documents as unknown as RequiredDocument[])
    : []
  const effectiveDocuments: RequiredDocument[] = documents ?? existingDocuments

  let result
  try {
    result = await tailorCv(
      anthropic,
      profile.cv_text,
      {
        company_name: application.company_name,
        position_title: application.position_title,
        job_description: application.job_description,
      },
      effectiveDocuments
    )
  } catch {
    // AI hatasında ücretsiz krediyi iade et — tek hak bir hatadan yanmasın.
    if (freeCreditConsumed) await refundFreeCvCredit(admin, userId)
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
      required_documents: effectiveDocuments as never,
    } as never)
    .eq('id', application_id)
    .eq('user_id', userId)

  return NextResponse.json({
    data: {
      tailored_cv: result.tailored_cv,
      score: result.score,
      suggestions: result.suggestions,
      documents: effectiveDocuments,
    },
  })
}
