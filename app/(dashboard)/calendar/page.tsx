import Link from 'next/link'
import { differenceInDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { formatDate, formatRelative } from '@/utils/format'
import { FOLLOW_UP_AFTER_DAYS } from '@/lib/planner'
import { CalendarGrid } from '@/components/calendar/CalendarGrid'
import type { Application } from '@/lib/types'

export default async function CalendarPage() {
  const supabase = createClient()
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  const apps = (applications ?? []) as Application[]

  const upcomingInterviews = apps
    .filter((app) => app.interview_date && new Date(app.interview_date) >= new Date())
    .sort((a, b) => new Date(a.interview_date!).getTime() - new Date(b.interview_date!).getTime())

  const followUps = apps.filter((app) => {
    if (app.status !== 'pending') return false
    const referenceDate = app.applied_at ?? app.created_at
    return referenceDate && differenceInDays(new Date(), new Date(referenceDate)) >= FOLLOW_UP_AFTER_DAYS
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Takvim</h1>
        <p className="text-sm text-slate-500">Yaklaşan mülakatların ve takip hatırlatmaların</p>
      </div>

      {/* Takvim grid */}
      <Card>
        <CalendarGrid apps={apps} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">Yaklaşan Mülakatlar</h2>
          {upcomingInterviews.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">Şu anda yaklaşan mülakatınız yok.</p>
            </Card>
          ) : (
            upcomingInterviews.map((app) => (
              <Link key={app.id} href={`/applications/${app.id}`}>
                <Card className="flex items-center justify-between transition-shadow hover:shadow-lg">
                  <div>
                    <p className="font-semibold text-slate-800">{app.position_title}</p>
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
          <h2 className="text-sm font-semibold text-slate-800">Takip Hatırlatmaları</h2>
          {followUps.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">Bekleyen bir takip hatırlatması yok.</p>
            </Card>
          ) : (
            followUps.map((app) => (
              <Link key={app.id} href={`/applications/${app.id}`}>
                <Card className="flex items-center justify-between transition-shadow hover:shadow-lg">
                  <div>
                    <p className="font-semibold text-slate-800">{app.position_title}</p>
                    <p className="text-sm text-slate-500">{app.company_name}</p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {formatRelative(app.applied_at ?? app.created_at)} başvuruldu
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
