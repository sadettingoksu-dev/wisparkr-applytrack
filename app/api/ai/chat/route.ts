import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndIncrementUsage } from '@/lib/usage'
import { getAnthropicClient, DEFAULT_MODEL, TURKISH_WRITING_RULE } from '@/lib/anthropic'
import type { Application } from '@/lib/types'

const bodySchema = z.object({
  application_id: z.string().uuid(),
  message: z.string().min(1).max(4000),
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

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }
  const { application_id, message } = parsed.data

  const admin = createAdminClient()
  const usage = await checkAndIncrementUsage(admin, userId, profile.plan, 'ai_question')
  if (!usage.allowed) {
    return NextResponse.json(
      {
        error: {
          code: 'USAGE_LIMIT_REACHED',
          message: `Bu ay için AI soru limitine (${usage.limit}) ulaştınız. Plan yükseltin.`,
        },
      },
      { status: 403 }
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

  const { data: history } = await supabase
    .from('ai_messages')
    .select('role, content')
    .eq('application_id', application_id)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)

  const messages = ((history ?? []) as { role: 'user' | 'assistant'; content: string }[])
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }))
  messages.push({ role: 'user', content: message })

  const systemPrompt = [
    'Sen ApplyTrack uygulamasında bir mülakat hazırlık asistanısın.',
    'Kullanıcıya başvurduğu pozisyon için mülakat hazırlığında yardımcı oluyorsun.',
    `Şirket: ${application.company_name}`,
    `Pozisyon: ${application.position_title}`,
    application.job_description
      ? `İlan açıklaması: ${application.job_description.slice(0, 4000)}`
      : null,
    'Cevaplarını Türkçe, kısa, anlaşılır ve aksiyon odaklı ver; gerektiğinde madde',
    'işaretleri kullanarak yapılandır. ' + TURKISH_WRITING_RULE,
  ]
    .filter(Boolean)
    .join('\n')

  let reply: string
  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })
    const textBlock = response.content.find((block) => block.type === 'text')
    reply = textBlock && textBlock.type === 'text' ? textBlock.text : ''
  } catch (err) {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'AI isteği başarısız oldu.' } },
      { status: 502 }
    )
  }

  await supabase.from('ai_messages').insert([
    { user_id: userId, application_id, role: 'user', content: message },
    { user_id: userId, application_id, role: 'assistant', content: reply },
  ] as never)

  return NextResponse.json({
    data: { reply, usage: { used: usage.used, limit: usage.limit } },
  })
}
