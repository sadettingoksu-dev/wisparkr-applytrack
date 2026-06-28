import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { rateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/rateLimit'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndIncrementUsage } from '@/lib/usage'
import { getAnthropicClient, generateMockInterviewTurn, MOCK_INTERVIEW_QUESTION_COUNT } from '@/lib/anthropic'
import { getPlan } from '@/lib/plans'
import type { Application, RequiredDocument } from '@/lib/types'

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

  const rl = rateLimit('ai:' + ctx.userId, AI_RATE_LIMIT)
  if (!rl.allowed) return rateLimitResponse(rl)
  const { supabase, userId, profile } = ctx

  const plan = getPlan(profile.plan)
  if (!plan.features.mockInterview) {
    return NextResponse.json(
      {
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: 'Mülakat provası bu planda mevcut değil. Pro veya Career Coach plana geçin.',
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
  const usage = await checkAndIncrementUsage(admin, userId, profile.plan, 'mock_interview')
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

  const cvText = application.tailored_cv_text ?? profile.cv_text
  const requiredDocuments = Array.isArray(application.required_documents)
    ? (application.required_documents as unknown as RequiredDocument[])
    : []

  let result
  try {
    result = await generateMockInterviewTurn(anthropic, {
      job: {
        company_name: application.company_name,
        position_title: application.position_title,
        job_description: application.job_description,
      },
      cvText,
      requiredDocuments,
      history: [],
      questionNumber: 1,
      totalQuestions: MOCK_INTERVIEW_QUESTION_COUNT,
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'Mülakat başlatılamadı.' } },
      { status: 502 }
    )
  }

  const { data: interviewData, error: insertError } = await supabase
    .from('mock_interviews')
    .insert({ user_id: userId, application_id, question_count: 1 } as never)
    .select('id')
    .single()
  const interview = interviewData as { id: string } | null

  if (insertError || !interview) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: 'Mülakat oturumu oluşturulamadı.' } },
      { status: 500 }
    )
  }

  await supabase.from('mock_interview_messages').insert({
    mock_interview_id: interview.id,
    user_id: userId,
    role: 'interviewer',
    content: result.message,
  } as never)

  return NextResponse.json({
    data: { interview_id: interview.id, message: result.message },
  })
}
