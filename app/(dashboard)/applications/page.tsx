import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getPlan } from '@/lib/plans'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageInfo } from '@/components/ui/PageInfo'
import { CompareSelector } from '@/components/applications/CompareSelector'
import { LimitBanner } from '@/components/applications/LimitBanner'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'
import { getServerDict } from '@/lib/i18n-server'
import { formatDate } from '@/utils/format'
import type { Application, Profile } from '@/lib/types'

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
          {!limitReached && (
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
        <Card>
          <p className="text-sm text-slate-500">{t.applications.empty}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Link key={app.id} href={`/applications/${app.id}`}>
              <Card className="flex items-center justify-between gap-3 transition-shadow hover:shadow-lg">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{app.position_title}</p>
                  <p className="truncate text-sm text-slate-500">{app.company_name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {app.applied_at && (
                    <span className="hidden text-xs text-slate-400 sm:inline">{formatDate(app.applied_at)}</span>
                  )}
                  <Badge className={STATUS_BADGE_CLASSES[app.status]}>
                    {t.status[app.status]}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
