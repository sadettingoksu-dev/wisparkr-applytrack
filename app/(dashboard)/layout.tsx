import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { getEffectivePlanId } from '@/lib/plans'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  const user = data.user
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>

  let plan: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, trial_ends_at')
      .eq('id', user.id)
      .single()
    // Deneme aktifse rozet "free" yerine efektif planı (Pro) göstersin.
    plan = getEffectivePlanId(profile as { plan?: string; trial_ends_at?: string | null } | null)
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        name={meta.full_name ?? meta.name ?? user?.email ?? ''}
        email={user?.email ?? ''}
        avatarUrl={meta.avatar_url ?? meta.picture ?? null}
        plan={plan}
      />
      <div className="flex-1">
        <div className="flex justify-end px-8 py-4">
          <NotificationBell />
        </div>
        <main className="px-8 pb-8">{children}</main>
      </div>
    </div>
  )
}
