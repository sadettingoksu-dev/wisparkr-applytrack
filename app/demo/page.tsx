import Link from 'next/link'
import { Briefcase, MessageSquare, Trophy, TrendingUp, ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'
import { getServerDict } from '@/lib/i18n-server'
import { format } from '@/lib/i18n'
import type { ApplicationStatus } from '@/lib/types'

export const metadata = {
  title: 'Demo — Wisparkr',
  description: 'Kayıt olmadan Wisparkr panelini örnek verilerle keşfet.',
}

// Statik örnek başvurular — yalnızca demo görünümü için, DB'ye dokunmaz.
const SAMPLE_APPS: {
  position: string
  company: string
  status: ApplicationStatus
  fit: number
}[] = [
  { position: 'Frontend Developer', company: 'Spotify', status: 'interview', fit: 88 },
  { position: 'Product Manager', company: 'Google', status: 'pending', fit: 74 },
  { position: 'Data Analyst', company: 'Meta', status: 'offer', fit: 91 },
  { position: 'UX Designer', company: 'Airbnb', status: 'rejected', fit: 63 },
  { position: 'Backend Developer', company: 'Trendyol', status: 'pending', fit: 80 },
  { position: 'DevOps Engineer', company: 'Getir', status: 'interview', fit: 85 },
]

export default function DemoPage() {
  const t = getServerDict()

  const total = SAMPLE_APPS.length
  const inInterview = SAMPLE_APPS.filter((a) => a.status === 'interview').length
  const offers = SAMPLE_APPS.filter((a) => a.status === 'offer').length
  const avgScore = Math.round(SAMPLE_APPS.reduce((s, a) => s + a.fit, 0) / total)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      {/* Demo uyarı şeridi */}
      <div className="bg-purple-600 px-6 py-3 text-center text-sm text-white">
        {t.demo.banner}{' '}
        <Link href="/signup" className="font-semibold underline underline-offset-2">
          {t.demo.cta} →
        </Link>
      </div>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="text-2xl font-bold text-slate-900">{t.demo.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{t.demo.subtitle}</p>

          {/* Metrikler */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label={t.dashboard.metricTotal} value={total} icon={Briefcase} />
            <MetricCard label={t.dashboard.metricInterview} value={inInterview} icon={MessageSquare} />
            <MetricCard label={t.dashboard.metricOffers} value={offers} icon={Trophy} />
            <MetricCard label={t.dashboard.metricAvgScore} value={`%${avgScore}`} icon={TrendingUp} />
          </div>

          {/* Örnek başvurular */}
          <h2 className="mb-3 mt-10 text-lg font-semibold text-slate-900">{t.demo.recentTitle}</h2>
          <div className="space-y-3">
            {SAMPLE_APPS.map((app) => (
              <Card key={`${app.company}-${app.position}`} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{app.position}</p>
                  <p className="truncate text-sm text-slate-500">{app.company}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden text-xs font-medium text-purple-600 sm:inline">
                    {format(t.board.matchLabel, { score: app.fit })}
                  </span>
                  <Badge className={STATUS_BADGE_CLASSES[app.status]}>{t.status[app.status]}</Badge>
                </div>
              </Card>
            ))}
          </div>

          {/* Alt CTA */}
          <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-purple-200 bg-purple-50 p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900">{t.demo.banner}</h3>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {t.demo.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
