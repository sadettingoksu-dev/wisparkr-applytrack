import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPlan } from '@/lib/plans'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageInfo } from '@/components/ui/PageInfo'
import { CompareSelector } from '@/components/applications/CompareSelector'
import { LimitBanner } from '@/components/applications/LimitBanner'
import { ApplicationsList } from '@/components/applications/ApplicationsList'
import { getServerDict } from '@/lib/i18n-server'
import type { Application, ApplicationStatus, Profile } from '@/lib/types'

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: { limit?: string }
}) {
  const t = getServerDict()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const plan = getPlan((profileData as Profile | null)?.plan)
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  const apps = (applications ?? []) as Application[]
  const max = plan.limits.maxApplications
  const limitReached = max !== null && apps.length >= max
  const showBanner = limitReached || searchParams.limit === '1'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.applications.title}</h1>
          <p className="text-sm text-slate-500">{t.applications.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <PageInfo page="applications" />
          {apps.length >= 2 && <CompareSelector apps={apps} />}
          {/* Liste boşken üstteki buton gizlenir; ortadaki empty-state CTA tek giriş noktası kalır. */}
          {!limitReached && apps.length > 0 && (
            <Link href="/applications/new">
              <Button>
                <Plus className="h-4 w-4" />
                {t.applications.newApplication}
                {max !== null && (
                  <span className="ml-1 text-xs opacity-60">({apps.length}/{max})</span>
                )}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {showBanner && <LimitBanner used={apps.length} max={max ?? 2} />}

      {apps.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t.applications.emptyTitle}
          description={t.applications.emptyDesc}
          ctaLabel={t.applications.newApplication}
          ctaHref="/applications/new"
        />
      ) : (
        <ApplicationsList
          apps={apps}
          labels={t.applications}
          statusLabels={t.status as Record<ApplicationStatus, string>}
        />
      )}
    </div>
  )
}
