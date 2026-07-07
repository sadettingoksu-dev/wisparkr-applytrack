import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'

const schema = z.object({ code: z.string().min(4).max(16) })
const REWARD_CV_CREDITS = 1

/**
 * Yeni kullanıcı bir referans kodu ile geldiyse işler: davet edeni bağlar ve
 * davet edene +1 ücretsiz CV uyarlama kredisi (free_cv_credits) verir. Gün ödülü
 * yerine somut AI değeri — trial'ı bitmiş ücretsiz kullanıcıya da yarar. Her kullanıcı
 * yalnızca bir kez ödül tetikler.
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
    .select('id, free_cv_credits, referral_count')
    .eq('referral_code', code)
    .single()

  // Kod yoksa veya kendi kodunu kullanıyorsa sessizce geç.
  if (!referrer || referrer.id === userId) {
    return NextResponse.json({ data: { ok: false, reason: 'invalid' } })
  }

  // Yeni kullanıcının kendi satırına davetçiyi yaz (RLS update-own yeterli).
  await ctx.supabase.from('profiles').update({ referred_by: referrer.id } as never).eq('id', userId)

  // Davet edene +1 ücretsiz CV uyarlama kredisi.
  await admin
    .from('profiles')
    .update({
      free_cv_credits: (referrer.free_cv_credits ?? 0) + REWARD_CV_CREDITS,
      referral_count: (referrer.referral_count ?? 0) + 1,
    } as never)
    .eq('id', referrer.id)

  return NextResponse.json({ data: { ok: true } })
}
