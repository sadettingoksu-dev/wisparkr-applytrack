import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({ code: z.string().min(4).max(16) })
const REWARD_DAYS = 5

/**
 * Yeni kullanıcı bir referans kodu ile geldiyse işler: davet edeni bağlar ve
 * davet edene +5 gün Pro (trial uzatımı) verir. Her kullanıcı yalnızca bir kez.
 */
export async function POST(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { userId, profile } = ctx

  // Zaten bir davetçiye bağlıysa tekrar ödül verme.
  if (profile.referred_by) {
    return NextResponse.json({ data: { ok: false, reason: 'already' } })
  }

  const json = await request.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: { code: 'INVALID', message: 'Geçersiz kod.' } }, { status: 400 })
  }
  const code = parsed.data.code.toUpperCase()

  const admin = createAdminClient()
  const { data: referrer } = await admin
    .from('profiles')
    .select('id, trial_ends_at, referral_count')
    .eq('referral_code', code)
    .single()

  // Kod yoksa veya kendi kodunu kullanıyorsa sessizce geç.
  if (!referrer || referrer.id === userId) {
    return NextResponse.json({ data: { ok: false, reason: 'invalid' } })
  }

  // Yeni kullanıcının kendi satırına davetçiyi yaz (RLS update-own yeterli).
  await ctx.supabase.from('profiles').update({ referred_by: referrer.id } as never).eq('id', userId)

  // Davet edene +5 gün Pro: mevcut deneme sürüyorsa üstüne ekle, değilse şimdiden.
  const current = referrer.trial_ends_at ? new Date(referrer.trial_ends_at) : null
  const base = current && current.getTime() > Date.now() ? current : new Date()
  base.setDate(base.getDate() + REWARD_DAYS)

  await admin
    .from('profiles')
    .update({
      trial_ends_at: base.toISOString(),
      referral_count: (referrer.referral_count ?? 0) + 1,
    } as never)
    .eq('id', referrer.id)

  return NextResponse.json({ data: { ok: true } })
}
