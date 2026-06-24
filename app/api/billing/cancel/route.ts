import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { isLemonSqueezyConfigured, cancelSubscription } from '@/lib/lemonsqueezy'

export const runtime = 'nodejs'

/**
 * Cancels the user's active subscription at the end of the current period.
 * The user keeps access until `renews_at`; the billing webhook (or the next
 * effective-plan check) downgrades them to the trial/free state afterwards.
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

  // İptal dönem sonunda geçerli olur: kullanıcı renews_at'e kadar planını korur.
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

  return NextResponse.json({ data: { ends_at: endsAt } })
}
