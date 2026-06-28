import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'

const schema = z.object({
  notify_status_change: z.boolean().optional(),
  notify_interview: z.boolean().optional(),
  notify_product: z.boolean().optional(),
})

/** Kullanıcının bildirim tercihlerini günceller (profiles.notify_*). */
export async function PATCH(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx

  const json = await request.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: 'Geçersiz tercih.' } },
      { status: 400 }
    )
  }

  const { error } = await ctx.supabase
    .from('profiles')
    .update(parsed.data as never)
    .eq('id', ctx.userId)

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { ok: true } })
}
