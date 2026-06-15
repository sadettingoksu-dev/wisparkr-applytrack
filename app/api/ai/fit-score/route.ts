import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAndIncrementUsage } from '@/lib/usage'
import { getAnthropicClient, DEFAULT_MODEL, TURKISH_WRITING_RULE } from '@/lib/anthropic'
import { getPlan } from '@/lib/plans'
import type { Application } from '@/lib/types'

const bodySchema = z.object({
  application_id: z.string().uuid(),
})

const fitScoreSchema = z.object({
  score: z.number().min(0).max(100),
  suggestions: z.array(z.string()).min(1).max(5),
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
  if (!plan.features.cvFitScore) {
    return NextResponse.json(
      {
        error: {
          code: 'FEATURE_NOT_AVAILABLE',
          message: 'CV uyum skoru bu planda mevcut değil. Pro veya Career Coach plana geçin.',
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
  const usage = await checkAndIncrementUsage(admin, userId, profile.plan, 'fit_score')
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

  const prompt = [
    'Aşağıda bir adayın CV metni ve başvurduğu iş ilanının açıklaması var.',
    'Adayın bu ilana ne kadar uygun olduğunu 0-100 arası bir skorla değerlendir',
    've adayın CV/başvurusunu güçlendirmesi için tam olarak 3 somut öneri ver.',
    'Önerileri yazarken ' + TURKISH_WRITING_RULE,
    'SADECE şu JSON formatında cevap ver, başka hiçbir metin ekleme:',
    '{"score": <0-100 arası sayı>, "suggestions": ["öneri 1", "öneri 2", "öneri 3"]}',
    '',
    `İş ilanı (${application.company_name} - ${application.position_title}):`,
    (application.job_description || 'Açıklama yok').slice(0, 4000),
    '',
    'CV:',
    profile.cv_text.slice(0, 8000),
  ].join('\n')

  let result: z.infer<typeof fitScoreSchema>
  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })
    const textBlock = response.content.find((block) => block.type === 'text')
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const candidate = jsonMatch ? JSON.parse(jsonMatch[0]) : null
    const validated = fitScoreSchema.safeParse(candidate)
    if (!validated.success) throw new Error('invalid AI response shape')
    result = validated.data
  } catch (err) {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'AI uyum skoru hesaplanamadı.' } },
      { status: 502 }
    )
  }

  await supabase
    .from('applications')
    .update({ fit_score: result.score, fit_suggestions: result.suggestions } as never)
    .eq('id', application_id)
    .eq('user_id', userId)

  return NextResponse.json({ data: result })
}
