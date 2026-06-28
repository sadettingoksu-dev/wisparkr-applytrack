import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { rateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/rateLimit'
import {
  getAnthropicClient,
  generateMockInterviewTurn,
  generateMockInterviewFeedback,
  MOCK_INTERVIEW_QUESTION_COUNT,
} from '@/lib/anthropic'
import type { Application, MockInterview, MockInterviewMessage, RequiredDocument } from '@/lib/types'

const bodySchema = z.object({
  message: z.string().min(1).max(4000),
})

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }
  const { message } = parsed.data

  const { data: interviewData, error: interviewError } = await supabase
    .from('mock_interviews')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()
  const interview = interviewData as MockInterview | null

  if (interviewError || !interview) {
    return NextResponse.json(
      { error: { code: 'INTERVIEW_NOT_FOUND', message: 'Mülakat oturumu bulunamadı.' } },
      { status: 404 }
    )
  }

  if (interview.status !== 'in_progress') {
    return NextResponse.json(
      { error: { code: 'INTERVIEW_COMPLETED', message: 'Bu mülakat oturumu tamamlanmış.' } },
      { status: 409 }
    )
  }

  const { data: applicationData } = await supabase
    .from('applications')
    .select('*')
    .eq('id', interview.application_id)
    .single()
  const application = applicationData as Application | null

  if (!application) {
    return NextResponse.json(
      { error: { code: 'APPLICATION_NOT_FOUND', message: 'Başvuru bulunamadı.' } },
      { status: 404 }
    )
  }

  const { data: messagesData } = await supabase
    .from('mock_interview_messages')
    .select('*')
    .eq('mock_interview_id', interview.id)
    .order('created_at', { ascending: true })
  const history = ((messagesData ?? []) as MockInterviewMessage[]).map((m) => ({
    role: m.role,
    content: m.content,
  }))

  const cvText = application.tailored_cv_text ?? profile.cv_text
  const requiredDocuments = Array.isArray(application.required_documents)
    ? (application.required_documents as unknown as RequiredDocument[])
    : []

  const nextQuestionNumber = interview.question_count + 1

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
      history: [...history, { role: 'candidate', content: message }],
      questionNumber: nextQuestionNumber,
      totalQuestions: MOCK_INTERVIEW_QUESTION_COUNT,
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'Mülakatçı yanıt veremedi.' } },
      { status: 502 }
    )
  }

  await supabase.from('mock_interview_messages').insert([
    { mock_interview_id: interview.id, user_id: userId, role: 'candidate', content: message },
    { mock_interview_id: interview.id, user_id: userId, role: 'interviewer', content: result.message },
  ] as never)

  const updatedQuestionCount = result.is_final ? interview.question_count : nextQuestionNumber

  const responseData: {
    message: string
    is_final: boolean
    feedback?: import('@/lib/anthropic').MockInterviewFeedback
    overall_score?: number
  } = {
    message: result.message,
    is_final: result.is_final,
  }

  if (result.is_final) {
    const transcript = [
      ...history,
      { role: 'candidate' as const, content: message },
      { role: 'interviewer' as const, content: result.message },
    ]

    try {
      const feedback = await generateMockInterviewFeedback(anthropic, {
        job: {
          company_name: application.company_name,
          position_title: application.position_title,
          job_description: application.job_description,
        },
        cvText,
        transcript,
      })
      await supabase
        .from('mock_interviews')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          overall_score: feedback.overall_score,
          feedback: feedback as never,
          question_count: updatedQuestionCount,
        } as never)
        .eq('id', interview.id)
        .eq('user_id', userId)

      responseData.feedback = feedback
      responseData.overall_score = feedback.overall_score
    } catch {
      await supabase
        .from('mock_interviews')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          question_count: updatedQuestionCount,
        } as never)
        .eq('id', interview.id)
        .eq('user_id', userId)
    }
  } else {
    await supabase
      .from('mock_interviews')
      .update({ question_count: updatedQuestionCount } as never)
      .eq('id', interview.id)
      .eq('user_id', userId)
  }

  return NextResponse.json({ data: responseData })
}
