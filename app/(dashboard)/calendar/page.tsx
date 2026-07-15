import Link from 'next/link'
import { differenceInDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { formatDate, formatRelative } from '@/utils/format'
import { FOLLOW_UP_AFTER_DAYS, getUpcomingInterviews } from '@/lib/planner'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import { PageHeader } from '@/components/ui/PageHeader'
import { getServerDict } from '@/lib/i18n-server'
import { format } from '@/lib/i18n'
import type { Application } from '@/lib/types'

export default async function CalendarPage() {
  const t = getServerDict()
  const supabase = createClient()
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  const apps = (applications ?? []) as Application[]

  const upcomingInterviews = getUpcomingInterviews(apps)

  const followUps = apps.filter((app) => {
    if (app.status !== 'pending') return false
    const referenceDate = app.applied_at ?? app.created_at
    return referenceDate && differenceInDays(new Date(), new Date(referenceDate)) >= FOLLOW_UP_AFTER_DAYS
  })

  return (
    <div className="space-y-6">
      <PageHeader title={t.calendar.title} subtitle={t.calendar.subtitle} infoPage="calendar" />

      {/* Takvim grid */}
      <Card>
        <CalendarGrid apps={apps} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">{t.calendar.upcomingInterviews}</h2>
          {upcomingInterviews.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">{t.calendar.noUpcoming}</p>
            </Card>
          ) : (
            upcomingInterviews.map((app) => (
              <Link key={app.id} href={`/applications/${app.id}`}>
                <Card className="flex items-center justify-between transition-shadow hover:shadow-lg">
                  <div>
                    <p className="font-semibold text-slate-900">{app.position_title}</p>
                    <p className="text-sm text-slate-500">{app.company_name}</p>
                  </div>
                  <span className="text-sm text-purple-600">
                    {formatDate(app.interview_date!, 'd MMM yyyy HH:mm')}
                  </span>
                </Card>
              </Link>
            ))
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">{t.calendar.followUps}</h2>
          {followUps.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">{t.calendar.noFollowUps}</p>
            </Card>
          ) : (
            followUps.map((app) => (
              <Link key={app.id} href={`/applications/${app.id}`}>
                <Card className="flex items-center justify-between transition-shadow hover:shadow-lg">
                  <div>
                    <p className="font-semibold text-slate-900">{app.position_title}</p>
                    <p className="text-sm text-slate-500">{app.company_name}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {format(t.calendar.appliedLabel, { when: formatRelative(app.applied_at ?? app.created_at) })}
                  </span>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
