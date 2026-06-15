import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { getAnthropicClient, generateMockInterviewFeedback } from '@/lib/anthropic'
import type { Application, MockInterview, MockInterviewMessage } from '@/lib/types'

export async function POST(_request: Request, { params }: { params: { id: string } }) {
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
      { error: { code: 'INTERVIEW_COMPLETED', message: 'Bu mülakat oturumu zaten tamamlanmış.' } },
      { status: 409 }
    )
  }

  const { data: messagesData } = await supabase
    .from('mock_interview_messages')
    .select('*')
    .eq('mock_interview_id', interview.id)
    .order('created_at', { ascending: true })
  const messages = (messagesData ?? []) as MockInterviewMessage[]
  const history = messages.map((m) => ({ role: m.role, content: m.content }))

  if (!messages.some((m) => m.role === 'candidate')) {
    return NextResponse.json(
      {
        error: {
          code: 'NO_ANSWERS_YET',
          message: 'Önce en az bir soruyu yanıtlamalısın.',
        },
      },
      { status: 400 }
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

  const cvText = application.tailored_cv_text ?? profile.cv_text

  let feedback
  try {
    feedback = await generateMockInterviewFeedback(anthropic, {
      job: {
        company_name: application.company_name,
        position_title: application.position_title,
        job_description: application.job_description,
      },
      cvText,
      transcript: history,
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'Geri bildirim raporu oluşturulamadı.' } },
      { status: 502 }
    )
  }

  await supabase
    .from('mock_interviews')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      overall_score: feedback.overall_score,
      feedback: feedback as never,
    } as never)
    .eq('id', interview.id)
    .eq('user_id', userId)

  return NextResponse.json({ data: { feedback, overall_score: feedback.overall_score } })
}
