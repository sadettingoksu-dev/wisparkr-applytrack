'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart2, TrendingUp, Target, Award, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'
import { useI18n } from '@/components/i18n/I18nProvider'
import { format } from '@/lib/i18n'
import type { Application, ApplicationStatus } from '@/lib/types'

function StatCard({
  label,
  value,
  sub,
  status,
  selected,
  onClick,
}: {
  label: string
  value: string | number
  sub?: string
  status?: ApplicationStatus
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 space-y-1 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${selected ? 'border-amber-400 bg-amber-500/10 shadow-md' : 'border-white/10 bg-white/5'}`}
    >
      <p className="text-xs text-white/50">{label}</p>
      <p className={`text-2xl font-bold ${selected ? 'text-amber-600' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  )
}

function MiniBar({
  label,
  count,
  total,
  color,
  selected,
  onClick,
}: {
  label: string
  count: number
  total: number
  color: string
  selected?: boolean
  onClick?: () => void
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div
      onClick={onClick}
      className={`space-y-1 rounded-lg p-2 transition-all ${onClick ? 'cursor-pointer hover:bg-white/5' : ''} ${selected ? 'bg-amber-500/10' : ''}`}
    >
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${selected ? 'text-amber-600' : 'text-white/70'}`}>{label}</span>
        <span className="font-medium text-white">
          {count} <span className="text-xs text-white/40">(%{pct})</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`h-2 rounded-full transition-all ${color} ${selected ? 'opacity-100' : 'opacity-70'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const STATUS_ROWS: { status: ApplicationStatus; color: string }[] = [
  { status: 'pending', color: 'bg-amber-400' },
  { status: 'interview', color: 'bg-blue-400' },
  { status: 'offer', color: 'bg-emerald-400' },
  { status: 'rejected', color: 'bg-red-300' },
]

type ScoreKey = 'excellent' | 'good' | 'medium' | 'low'

const SCORE_ROWS: { key: ScoreKey; filter: (s: number) => boolean; color: string }[] = [
  { key: 'excellent', filter: (s: number) => s >= 90, color: 'bg-emerald-500' },
  { key: 'good', filter: (s: number) => s >= 75 && s < 90, color: 'bg-blue-400' },
  { key: 'medium', filter: (s: number) => s >= 50 && s < 75, color: 'bg-amber-400' },
  { key: 'low', filter: (s: number) => s < 50, color: 'bg-red-300' },
]

export function AnalyticsDashboard({ apps }: { apps: Application[] }) {
  const { t, locale } = useI18n()
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | null>(null)
  const [selectedScoreKey, setSelectedScoreKey] = useState<ScoreKey | null>(null)

  const total = apps.length
  const byStatus = {
    pending: apps.filter((a) => a.status === 'pending').length,
    interview: apps.filter((a) => a.status === 'interview').length,
    offer: apps.filter((a) => a.status === 'offer').length,
    rejected: apps.filter((a) => a.status === 'rejected').length,
  }
  const interviewRate = total > 0 ? Math.round(((byStatus.interview + byStatus.offer) / total) * 100) : 0
  const offerRate = total > 0 ? Math.round((byStatus.offer / total) * 100) : 0
  const scores = apps.map((a) => a.fit_score).filter((s): s is number => s !== null)
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const maxScore = scores.length ? Math.max(...scores) : null

  // Son 6 ay
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    return {
      label: d.toLocaleDateString(locale === 'en' ? 'en-US' : 'tr-TR', { month: 'short', year: '2-digit' }),
      count: apps.filter((a) => {
        const c = new Date(a.created_at)
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
      }).length,
    }
  })
  const maxMonthCount = Math.max(...months.map((m) => m.count), 1)

  // Seçili filtreye göre sağ panel başvuruları
  let panelApps: Application[] = []
  let panelTitle = ''

  if (selectedStatus) {
    panelApps = apps.filter((a) => a.status === selectedStatus)
    panelTitle = t.status[selectedStatus]
  } else if (selectedScoreKey) {
    const row = SCORE_ROWS.find((r) => r.key === selectedScoreKey)
    if (row) {
      panelApps = apps.filter((a) => a.fit_score !== null && row.filter(a.fit_score!))
      panelTitle = t.analytics.score[selectedScoreKey]
    }
  }

  const showPanel = selectedStatus !== null || selectedScoreKey !== null

  function handleStatusClick(status: ApplicationStatus) {
    setSelectedScoreKey(null)
    setSelectedStatus((prev) => (prev === status ? null : status))
  }

  function handleScoreClick(key: ScoreKey) {
    setSelectedStatus(null)
    setSelectedScoreKey((prev) => (prev === key ? null : key))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t.analytics.title}</h1>
        <p className="text-sm text-white/50">{t.analytics.subtitle}</p>
      </div>

      {/* Özet metrikler */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t.analytics.total} value={total} />
        <StatCard
          label={t.analytics.interviewRate}
          value={`%${interviewRate}`}
          sub={format(t.analytics.interviewRateSub, { n: byStatus.interview + byStatus.offer })}
        />
        <StatCard label={t.analytics.offerRate} value={`%${offerRate}`} sub={format(t.analytics.offerRateSub, { n: byStatus.offer })} />
        <StatCard
          label={t.analytics.avgScore}
          value={avgScore !== null ? `%${avgScore}` : '—'}
          sub={maxScore !== null ? format(t.analytics.maxScoreSub, { n: maxScore }) : undefined}
        />
      </div>

      <div className={`grid gap-6 ${showPanel ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Sol: grafikler */}
        <div className={`space-y-6 ${showPanel ? 'lg:col-span-2' : ''}`}>
          {/* Durum dağılımı */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-white">{t.analytics.statusDist}</h2>
              <span className="text-xs text-white/40">{t.analytics.clickHint}</span>
            </div>
            {total === 0 ? (
              <p className="text-sm text-white/40">{t.analytics.noApps}</p>
            ) : (
              <div className="space-y-1">
                {STATUS_ROWS.map(({ status, color }) => (
                  <MiniBar
                    key={status}
                    label={t.status[status]}
                    count={byStatus[status]}
                    total={total}
                    color={color}
                    selected={selectedStatus === status}
                    onClick={() => handleStatusClick(status)}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Aylık trend */}
          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-white">{t.analytics.monthlyTrend}</h2>
            </div>
            {total === 0 ? (
              <p className="text-sm text-white/40">{t.analytics.noApps}</p>
            ) : (
              <div className="flex h-32 items-end gap-2">
                {months.map((m) => (
                  <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs font-medium text-white/70">{m.count || ''}</span>
                    <div
                      className="w-full rounded-t-sm bg-amber-400"
                      style={{
                        height: `${Math.round((m.count / maxMonthCount) * 96)}px`,
                        minHeight: m.count > 0 ? '4px' : '0',
                      }}
                    />
                    <span className="text-xs text-white/40">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Skor dağılımı */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-white">{t.analytics.scoreDist}</h2>
              <span className="text-xs text-white/40">{t.analytics.clickHint}</span>
            </div>
            {scores.length === 0 ? (
              <p className="text-sm text-white/40">{t.analytics.noScores}</p>
            ) : (
              <div className="space-y-1">
                {SCORE_ROWS.map((row) => (
                  <MiniBar
                    key={row.key}
                    label={t.analytics.score[row.key]}
                    count={scores.filter(row.filter).length}
                    total={scores.length}
                    color={row.color}
                    selected={selectedScoreKey === row.key}
                    onClick={() => handleScoreClick(row.key)}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sağ: detay paneli */}
        {showPanel && (
          <div className="lg:col-span-1">
            <Card className="sticky top-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  <h2 className="text-sm font-semibold text-white">{panelTitle}</h2>
                  <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-xs font-medium text-amber-500">
                    {panelApps.length}
                  </span>
                </div>
                <button
                  onClick={() => { setSelectedStatus(null); setSelectedScoreKey(null) }}
                  className="text-white/40 hover:text-white/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {panelApps.length === 0 ? (
                <p className="text-sm text-white/40">{t.analytics.noneInCategory}</p>
              ) : (
                <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                  {panelApps.map((a) => (
                    <Link
                      key={a.id}
                      href={`/applications/${a.id}`}
                      className="flex items-start justify-between rounded-lg border border-white/10 px-3 py-2.5 hover:bg-white/5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white/90">{a.position_title}</p>
                        <p className="truncate text-xs text-white/40">{a.company_name}</p>
                        {a.fit_score !== null && (
                          <p className="mt-0.5 text-xs text-amber-400">{format(t.analytics.matchPrefix, { n: a.fit_score })}</p>
                        )}
                      </div>
                      <Badge className={`ml-2 mt-0.5 shrink-0 ${STATUS_BADGE_CLASSES[a.status]}`}>
                        {t.status[a.status]}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
