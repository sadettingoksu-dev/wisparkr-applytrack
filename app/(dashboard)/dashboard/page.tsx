import Link from 'next/link'
import { Briefcase, MessageSquare, Trophy, TrendingUp, Send, ListChecks, ArrowRight, BarChart2, FilePlus, FileText, Bot, Mic } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { ParkrcanWidget } from '@/components/assistant/ParkrcanWidget'
import { PageInfo } from '@/components/ui/PageInfo'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { generateTasks, type PlannerTaskKind } from '@/lib/planner'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{greeting}</h1>
          <p className="text-sm text-slate-500">{t.dashboard.subtitle}</p>
        </div>
        <PageInfo page="dashboard" />
      </div>

      <OnboardingBanner hasApplications={apps.length > 0} hasCv={!!(profileData as { cv_text?: string } | null)?.cv_text} />

      {/* Hızlı işlemler — en sık kullanılan aksiyonlara tek tık */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { href: '/applications/new', label: t.dashboard.qaNewApp, icon: FilePlus },
          { href: '/cv-builder', label: t.dashboard.qaCv, icon: FileText },
          { href: '/assistant', label: t.dashboard.qaAssistant, icon: Bot },
          { href: '/interview', label: t.dashboard.qaInterview, icon: Mic },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="flex items-center gap-3 transition-shadow hover:shadow-lg">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-slate-800">{label}</span>
            </Card>
          </Link>
        ))}
      </div>

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
        {/* Yapılacaklar */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-slate-900">{t.dashboard.todos}</h2>
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
                return (
                  <Link key={task.id} href={task.href}>
                    <Card className="flex items-center gap-3 transition-shadow hover:shadow-lg">
                      <Icon className="h-5 w-5 flex-shrink-0 text-purple-600" />
                      <p className="text-sm font-medium text-slate-900">{label}</p>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Son başvurular */}
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
      </div>

      {/* Analitik artık dashboard içinde */}
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
