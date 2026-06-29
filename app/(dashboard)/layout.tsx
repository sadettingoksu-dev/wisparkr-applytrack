import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget'
import { ReferralClaimer } from '@/components/referral/ReferralClaimer'
import { getEffectivePlanId } from '@/lib/plans'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>

  let plan: string | null = null
  let effectivePlan: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, trial_ends_at')
      .eq('id', user.id)
      .single()
    // Rozet GERÇEK planı gösterir: yalnızca ödeme yapan hesaplar Pro/Career Coach,
    // deneme hesapları "Ücretsiz" görünür (landing navbar ile tutarlı).
    plan = (profile as { plan?: string } | null)?.plan ?? 'free'
    // Sidebar kilitleri EFEKTİF plana göre: aktif deneme = Pro seviyesi erişim.
    effectivePlan = getEffectivePlanId(profile as { plan?: string | null; trial_ends_at?: string | null } | null)
  }

  return (
    <DashboardShell
      name={meta.full_name ?? meta.name ?? user?.email ?? ''}
      email={user?.email ?? ''}
      avatarUrl={meta.avatar_url ?? meta.picture ?? null}
      plan={plan}
      effectivePlan={effectivePlan}
    >
      {children}
      <FeedbackWidget />
      <ReferralClaimer />
    </DashboardShell>
  )
}
