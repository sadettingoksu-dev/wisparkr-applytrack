import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireExtensionAuth, isAuthedContext } from '@/lib/apiAuth'
import { getPlan } from '@/lib/plans'

export const runtime = 'nodejs'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const createSchema = z.object({
  company_name: z.string().min(1).max(200),
  position_title: z.string().min(1).max(200),
  job_url: z.string().url().optional().nullable(),
  job_description: z.string().max(10000).optional().nullable(),
})

function withCors(response: NextResponse) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }))
}

export async function POST(request: Request) {
  const ctx = await requireExtensionAuth(request)
  if (!isAuthedContext(ctx)) return withCors(ctx)
  const { supabase, userId, profile } = ctx

  const json = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return withCors(
      NextResponse.json(
        { error: { code: 'INVALID_BODY', message: parsed.error.message } },
        { status: 400 }
      )
    )
  }

  const plan = getPlan(profile.plan)
  if (plan.limits.maxApplications !== null) {
    const { count, error: countError } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      return withCors(
        NextResponse.json(
          { error: { code: 'DB_ERROR', message: countError.message } },
          { status: 500 }
        )
      )
    }

    if ((count ?? 0) >= plan.limits.maxApplications) {
      return withCors(
        NextResponse.json(
          {
            error: {
              code: 'LIMIT_REACHED',
              message: `Free planda en fazla ${plan.limits.maxApplications} başvuru ekleyebilirsiniz. Pro plana geçin.`,
            },
          },
          { status: 403 }
        )
      )
    }
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({ ...parsed.data, user_id: userId, status: 'pending' } as never)
    .select('*')
    .single()

  if (error) {
    return withCors(
      NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 })
    )
  }

  return withCors(NextResponse.json({ data }, { status: 201 }))
}
