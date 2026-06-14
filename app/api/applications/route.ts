import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { getPlan } from '@/lib/plans'

const createSchema = z.object({
  company_name: z.string().min(1).max(200),
  position_title: z.string().min(1).max(200),
  job_url: z.string().url().optional().nullable(),
  job_description: z.string().max(10000).optional().nullable(),
  status: z.enum(['pending', 'interview', 'offer', 'rejected']).optional(),
})

export async function GET(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId, profile } = ctx

  const json = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const plan = getPlan(profile.plan)
  if (plan.limits.maxApplications !== null) {
    const { count, error: countError } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (countError) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: countError.message } },
        { status: 500 }
      )
    }

    if ((count ?? 0) >= plan.limits.maxApplications) {
      return NextResponse.json(
        {
          error: {
            code: 'LIMIT_REACHED',
            message: `Free planda en fazla ${plan.limits.maxApplications} başvuru ekleyebilirsiniz. Pro plana geçin.`,
          },
        },
        { status: 403 }
      )
    }
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({ ...parsed.data, user_id: userId } as never)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data }, { status: 201 })
}
