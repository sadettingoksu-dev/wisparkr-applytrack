import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { getPlan } from '@/lib/plans'
import { formatDate } from '@/utils/format'
import type { Profile, Subscription } from '@/lib/types'

export default async function BillingPage() {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const userId = data.user!.id

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const plan = getPlan((profile as Profile | null)?.plan)
  const sub = subscription as Subscription | null

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Faturalama</h1>
        <p className="text-sm text-slate-500">Mevcut planın ve abonelik durumun</p>
      </div>

      <Card className="space-y-2">
        <p className="text-sm text-slate-500">Mevcut Plan</p>
        <p className="text-xl font-semibold text-purple-600">
          {plan.name} — ${plan.priceMonthly}/ay
        </p>
        {sub?.renews_at && (
          <p className="text-sm text-slate-500">
            Yenileme tarihi: {formatDate(sub.renews_at)}
          </p>
        )}
        {plan.id === 'free' && (
          <p className="text-sm text-slate-500">
            Daha fazla özellik için{' '}
            <a href="/pricing" className="font-medium text-purple-600">
              planını yükselt
            </a>
            .
          </p>
        )}
      </Card>
    </div>
  )
}
