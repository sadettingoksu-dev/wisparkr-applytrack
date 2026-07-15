import Link from 'next/link'
import { Briefcase, MessageSquare, Trophy, TrendingUp, Send, ListChecks, ArrowRight, BarChart2, CalendarDays, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { ParkrcanWidget } from '@/components/assistant/ParkrcanWidget'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { generateTasks, getUpcomingInterviews, type PlannerTaskKind } from '@/lib/planner'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import { getServerDict } from '@/lib/i18n-server'
import { format } from '@/lib/i18n'
import type { Application } from '@/lib/types'

const TASK_ICONS: Record<PlannerTaskKind, typeof Send> = {
  interview_prep: MessageSquare,
  follow_up: Send,
  fit_score: TrendingUp,
}

export default async function DashboardPage() {
  const t = getServerDict()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>
  const fullName = meta.full_name ?? meta.name ?? ''
  const firstName = fullName.trim().split(' ')[0] ?? ''
  const greeting = firstName
    ? format(t.dashboard.greeting, { name: firstName })
    : t.dashboard.greetingNoName
  const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })
  const apps = (applications ?? []) as Application[]

  const total = apps.length
  const inInterview = apps.filter((a) => a.status === 'interview').length
  const offers = apps.filter((a) => a.status === 'offer').length
  const scores = apps.map((a) => a.fit_score).filter((s): s is number => s !== null)
  const avgScore = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : null

  const tasks = generateTasks(apps)
  const recentApps = apps.slice(0, 5)
  const upcoming = getUpcomingInterviews(apps).slice(0, 5)

  return (
    // pb-10: parkrcan yalnızca burada render ediliyor ve geri bildirim
    // widget'ından yukarıda duruyor (bottom-24 + h-16) — kabuğun pb-24'üne ek.
    <div className="space-y-6 pb-10">
      {/* Tek birincil aksiyon. Eskiden burada 4 "hızlı işlem" kartı vardı ama
          dördü de sidebar'da zaten var; metrik kartlarıyla birlikte üst üste
          8 kart hiyerarşiyi yok ediyordu. */}
      <PageHeader
        title={greeting}
        subtitle={t.dashboard.subtitle}
        infoPage="dashboard"
        actions={
          <Link href="/applications/new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.dashboard.qaNewApp}
            </Button>
          </Link>
        }
      />

      <OnboardingBanner hasApplications={apps.length > 0} hasCv={!!(profileData as { cv_text?: string } | null)?.cv_text} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label={t.dashboard.metricTotal} value={total} icon={Briefcase} />
        <MetricCard label={t.dashboard.metricInterview} value={inInterview} icon={MessageSquare} />
        <MetricCard label={t.dashboard.metricOffers} value={offers} icon={Trophy} />
        <MetricCard
          label={t.dashboard.metricAvgScore}
          value={avgScore !== null ? `%${avgScore}` : '—'}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sıradaki adımlar — lib/planner.ts'in başvuru verisinden TÜRETTİĞİ
            liste. Kullanıcı buraya elle bir şey ekleyemez; bu yüzden her
            satırın altında neden çıktığı yazar ve başlıkta otomatik olduğu
            belirtilir (eski "Yapılacaklar" adı ekleme yapılabilir sanısı
            veriyordu). */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">{t.dashboard.nextSteps}</h2>
            <span className="text-xs text-slate-400">{t.dashboard.nextStepsHint}</span>
          </div>
          {tasks.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">{t.dashboard.noTodos}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const Icon = TASK_ICONS[task.kind]
                const label = format(t.planner[task.variant], { company: task.company, days: task.daysLeft ?? 0 })
                const reason = format(t.planner[task.reason], { days: task.daysWaiting ?? 0 })
                return (
                  <Link key={task.id} href={task.href}>
                    <Card className="flex items-center gap-3 transition-shadow hover:shadow-lg">
                      <Icon className="h-5 w-5 flex-shrink-0 text-purple-600" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{label}</p>
                        <p className="text-xs text-slate-400">{reason}</p>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Yaklaşan mülakatlar — Takvim'in verisi (applications.interview_date). */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-slate-900">{t.calendar.upcomingInterviews}</h2>
            </div>
            <Link href="/calendar" className="flex items-center gap-1 text-xs text-purple-600 hover:underline">
              {t.dashboard.all} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <Card>
              <p className="text-sm text-slate-500">{t.calendar.noUpcoming}</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((app) => (
                <Link key={app.id} href={`/applications/${app.id}`}>
                  <Card className="flex items-center justify-between gap-3 transition-shadow hover:shadow-lg">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{app.position_title}</p>
                      <p className="truncate text-xs text-slate-400">{app.company_name}</p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-purple-600">
                      {formatDate(app.interview_date!, 'd MMM HH:mm')}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Son başvurular — tam genişlik */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">{t.dashboard.recentApps}</h2>
          </div>
          <Link href="/applications" className="flex items-center gap-1 text-xs text-purple-600 hover:underline">
            {t.dashboard.all} <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {recentApps.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={t.dashboard.noApps}
            description={t.dashboard.noAppsDesc}
            ctaLabel={t.dashboard.noAppsCta}
            ctaHref="/applications/new"
          />
        ) : (
          <Card className="divide-y divide-slate-200">
            {recentApps.map((app) => (
              <Link
                key={app.id}
                href={`/applications/${app.id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:opacity-75"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{app.position_title}</p>
                  <p className="truncate text-xs text-slate-400">{app.company_name}</p>
                </div>
                <Badge className={`ml-3 shrink-0 ${STATUS_BADGE_CLASSES[app.status]}`}>
                  {t.status[app.status]}
                </Badge>
              </Link>
            ))}
          </Card>
        )}
      </div>

      {/* Analitik artık dashboard içinde. Üstteki metrik kartları SAYILARI,
          buradaki kartlar ORANLARI gösterir — daha önce ikisi de toplam ve
          ortalama skoru basıyordu (aynı sayfada aynı sayı iki kez). */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-900">{t.analytics.title}</h2>
        </div>
        <AnalyticsDashboard apps={apps} embedded />
      </div>

      {/* parkrcan — uygulama içi AI rehberi (yalnızca ana sayfa) */}
      <ParkrcanWidget />
    </div>
  )
}
