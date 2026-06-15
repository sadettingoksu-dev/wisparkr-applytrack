import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { getAnthropicClient, analyzeRequiredDocuments } from '@/lib/anthropic'
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

  let documents: RequiredDocument[]
  try {
    const analyzed = await analyzeRequiredDocuments(anthropic, {
      company_name: application.company_name,
      position_title: application.position_title,
      job_description: application.job_description,
    })
    documents = analyzed.map((doc) => ({ ...doc, has: null }))
  } catch {
    return NextResponse.json(
      { error: { code: 'AI_REQUEST_FAILED', message: 'Gerekli belgeler analiz edilemedi.' } },
      { status: 502 }
    )
  }

  await supabase
    .from('applications')
    .update({ required_documents: documents } as never)
    .eq('id', application_id)
    .eq('user_id', userId)

  return NextResponse.json({ data: { documents } })
}
