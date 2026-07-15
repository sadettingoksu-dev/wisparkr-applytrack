import Link from 'next/link'
import { Briefcase, MessageSquare, Trophy, TrendingUp, Send, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { OnboardingBanner } from '@/components/dashboard/OnboardingBanner'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { ParkrcanWidget } from '@/components/assistant/ParkrcanWidget'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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

/**
 * HİZA KURALI — bu sayfadaki her bölüm aynı sol kenarı paylaşır.
 *
 * Eskiden başlıkların önünde dekoratif ikonlar vardı (`h-5 w-5` + `gap-2`);
 * ikon kartların soluna taşıyor, başlık metni 28px sağa kayıyordu. Ölçüldüğünde
 * sayfada ÜÇ ayrı sol kenar çıkıyordu: kartlar 288, bölüm başlıkları 316,
 * kart içi başlıklar 337. "Hiçbir şey oturmuyor" hissinin sebebi buydu.
 * İkonlar kaldırıldı → başlık metni de kart kenarıyla aynı hizada.
 */
const sectionTitleClass = 'text-lg font-semibold text-slate-900'

/** Başlık + (opsiyonel) "Tümü →" + tek kart gövde. Her bölüm bunu kullanır. */
function Section({
  title,
  hint,
  allHref,
  allLabel,
  children,
}: {
  title: string
  hint?: string
  allHref?: string
  allLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className={sectionTitleClass}>{title}</h2>
          {hint && <span className="truncate text-xs text-slate-400">{hint}</span>}
        </div>
        {allHref && (
          <Link href={allHref} className="flex shrink-0 items-center gap-1 text-xs text-purple-600 hover:underline">
            {allLabel} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      <Card>{children}</Card>
    </div>
  )
}

/**
 * Liste gövdesi — TEK kart içinde ayraçlı satırlar.
 * Eskiden "Sıradaki adımlar" ayrı ayrı kartlardı ama "Son Başvurular" tek kart +
 * ayraçtı; aynı sayfada iki farklı liste stili vardı. Artık üçü de aynı.
 */
function Rows({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-slate-100">{children}</div>
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 py-3 transition-opacity first:pt-0 last:pb-0 hover:opacity-70"
    >
      {children}
    </Link>
  )
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
      {/* Aksiyon YOK. Eskiden 4 "hızlı işlem" kartı vardı (dördü de sidebar'da),
          sonra tek "Yeni Başvuru" butonuna indirildi — o da kaldırıldı:
          başvuru ekleme Başvurular sayfasının işi, ana sayfa bir ÖZET. */}
      <PageHeader title={greeting} subtitle={t.dashboard.subtitle} infoPage="dashboard" />

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
        <Section title={t.dashboard.nextSteps} hint={t.dashboard.nextStepsHint}>
          {tasks.length === 0 ? (
            <p className="text-sm text-slate-500">{t.dashboard.noTodos}</p>
          ) : (
            <Rows>
              {tasks.map((task) => {
                const Icon = TASK_ICONS[task.kind]
                const label = format(t.planner[task.variant], { company: task.company, days: task.daysLeft ?? 0 })
                const reason = format(t.planner[task.reason], { days: task.daysWaiting ?? 0 })
                return (
                  <Row key={task.id} href={task.href}>
                    <Icon className="h-4 w-4 shrink-0 text-purple-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{label}</p>
                      <p className="truncate text-xs text-slate-400">{reason}</p>
                    </div>
                  </Row>
                )
              })}
            </Rows>
          )}
        </Section>

        {/* Yaklaşan mülakatlar — Takvim'in verisi (applications.interview_date). */}
        <Section title={t.calendar.upcomingInterviews} allHref="/calendar" allLabel={t.dashboard.all}>
          {upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">{t.calendar.noUpcoming}</p>
          ) : (
            <Rows>
              {upcoming.map((app) => (
                <Row key={app.id} href={`/applications/${app.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{app.position_title}</p>
                    <p className="truncate text-xs text-slate-400">{app.company_name}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-purple-600">
                    {formatDate(app.interview_date!, 'd MMM HH:mm')}
                  </span>
                </Row>
              ))}
            </Rows>
          )}
        </Section>
      </div>

      {/* Son başvurular — tam genişlik */}
      {recentApps.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={t.dashboard.noApps}
          description={t.dashboard.noAppsDesc}
          ctaLabel={t.dashboard.noAppsCta}
          ctaHref="/applications/new"
        />
      ) : (
        <Section title={t.dashboard.recentApps} allHref="/applications" allLabel={t.dashboard.all}>
          <Rows>
            {recentApps.map((app) => (
              <Row key={app.id} href={`/applications/${app.id}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{app.position_title}</p>
                  <p className="truncate text-xs text-slate-400">{app.company_name}</p>
                </div>
                <Badge className={`shrink-0 ${STATUS_BADGE_CLASSES[app.status]}`}>
                  {t.status[app.status]}
                </Badge>
              </Row>
            ))}
          </Rows>
        </Section>
      )}

      {/* Analitik artık dashboard içinde. Üstteki metrik kartları SAYILARI,
          buradaki kartlar ORANLARI gösterir — daha önce ikisi de toplam ve
          ortalama skoru basıyordu (aynı sayfada aynı sayı iki kez). */}
      <div className="space-y-3">
        <h2 className={sectionTitleClass}>{t.analytics.title}</h2>
        <AnalyticsDashboard apps={apps} embedded />
      </div>

      {/* parkrcan — uygulama içi AI rehberi (yalnızca ana sayfa) */}
      <ParkrcanWidget />
    </div>
  )
}
