import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'

const patchSchema = z.object({ revoked: z.boolean() })

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const json = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'INVALID_BODY', message: 'Geçersiz istek.' } }, { status: 400 })
  }

  const { error } = await supabase
    .from('cv_shares')
    .update({ revoked: parsed.data.revoked } as never)
    .eq('id', params.id)
    .eq('user_id', userId)

  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 })
  }
  return NextResponse.json({ data: { revoked: parsed.data.revoked } })
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const { error } = await supabase.from('cv_shares').delete().eq('id', params.id).eq('user_id', userId)
  if (error) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } }, { status: 500 })
  }
  return NextResponse.json({ data: { deleted: true } })
}
