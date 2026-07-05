import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { isLemonSqueezyConfigured, cancelSubscription } from '@/lib/lemonsqueezy'

export const runtime = 'nodejs'

/**
 * Cancels the user's active subscription. Lemon Squeezy stops future billing at
 * period end, but a *voluntary* cancellation takes effect immediately in our app:
 * we downgrade the profile to `free` right away so the UI doesn't show a
 * misleading "active until <date>" countdown. Natural expiry (subscription_expired
 * webhook) also lands on free, so both paths are consistent.
 */
export async function POST() {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { userId } = ctx

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const subscription = sub as { id: string; ls_subscription_id: string | null; status: string; renews_at: string | null } | null

  if (!subscription || subscription.status === 'cancelled' || subscription.status === 'expired') {
    return NextResponse.json(
      { error: { code: 'NO_ACTIVE_SUBSCRIPTION', message: 'İptal edilecek aktif bir aboneliğin yok.' } },
      { status: 400 }
    )
  }

  // LS'de fatura dönem sonunda durur; bizde iptal anında geçerli olur (aşağıda plan=free).
  let endsAt = subscription.renews_at

  if (isLemonSqueezyConfigured() && subscription.ls_subscription_id) {
    try {
      const lsEndsAt = await cancelSubscription(subscription.ls_subscription_id)
      if (lsEndsAt) endsAt = lsEndsAt
    } catch (err) {
      return NextResponse.json(
        { error: { code: 'CANCEL_FAILED', message: 'Abonelik iptal edilemedi, lütfen tekrar dene.' } },
        { status: 502 }
      )
    }
  }

  const { error } = await admin
    .from('subscriptions')
    .update({ status: 'cancelled', ends_at: endsAt } as never)
    .eq('id', subscription.id)

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  // Gönüllü iptal anında etki eder: kullanıcıyı hemen ücretsiz plana düşür.
  await admin.from('profiles').update({ plan: 'free' } as never).eq('id', userId)

  return NextResponse.json({ data: { ends_at: endsAt, plan: 'free' } })
}
