import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { rateLimit, rateLimitResponse, AI_RATE_LIMIT } from '@/lib/rateLimit'

const bodySchema = z.object({
  message: z.string().min(2).max(2000),
  category: z.string().max(40).optional(),
  page: z.string().max(200).optional(),
})

export async function POST(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx

  const rl = rateLimit('feedback:' + ctx.userId, AI_RATE_LIMIT)
  if (!rl.allowed) return rateLimitResponse(rl)

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const { error } = await ctx.supabase.from('feedback').insert({
    user_id: ctx.userId,
    message: parsed.data.message,
    category: parsed.data.category ?? null,
    page: parsed.data.page ?? null,
  } as never)

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { ok: true } })
}
