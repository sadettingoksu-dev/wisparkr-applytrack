import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'

const updateSchema = z.object({
  company_name: z.string().min(1).max(200).optional(),
  position_title: z.string().min(1).max(200).optional(),
  job_url: z.string().url().nullable().optional(),
  job_description: z.string().max(10000).nullable().optional(),
  status: z.enum(['pending', 'interview', 'offer', 'rejected']).optional(),
  notes: z.string().max(5000).nullable().optional(),
  interview_date: z.string().datetime().nullable().optional(),
})

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Başvuru bulunamadı.' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const json = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('applications')
    .update(parsed.data as never)
    .eq('id', params.id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Başvuru bulunamadı veya güncellenemedi.' } },
      { status: 404 }
    )
  }

  return NextResponse.json({ data })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', params.id)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { id: params.id } })
}
