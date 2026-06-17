'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart2, TrendingUp, Target, Award, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from '@/utils/constants'
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

const STATUS_ROWS: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: 'pending', label: 'Beklemede', color: 'bg-amber-400' },
  { status: 'interview', label: 'Mülakat', color: 'bg-blue-400' },
  { status: 'offer', label: 'Teklif', color: 'bg-emerald-400' },
  { status: 'rejected', label: 'Reddedildi', color: 'bg-red-300' },
]

const SCORE_ROWS = [
  { label: 'Mükemmel (90-100)', filter: (s: number) => s >= 90, color: 'bg-emerald-500' },
  { label: 'İyi (75-89)', filter: (s: number) => s >= 75 && s < 90, color: 'bg-blue-400' },
  { label: 'Orta (50-74)', filter: (s: number) => s >= 50 && s < 75, color: 'bg-amber-400' },
  { label: 'Düşük (0-49)', filter: (s: number) => s < 50, color: 'bg-red-300' },
]

export function AnalyticsDashboard({ apps }: { apps: Application[] }) {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | null>(null)
  const [selectedScoreLabel, setSelectedScoreLabel] = useState<string | null>(null)

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
      label: d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }),
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
    panelTitle = STATUS_LABELS[selectedStatus]
  } else if (selectedScoreLabel) {
    const row = SCORE_ROWS.find((r) => r.label === selectedScoreLabel)
    if (row) {
      panelApps = apps.filter((a) => a.fit_score !== null && row.filter(a.fit_score!))
      panelTitle = selectedScoreLabel
    }
  }

  const showPanel = selectedStatus !== null || selectedScoreLabel !== null

  function handleStatusClick(status: ApplicationStatus) {
    setSelectedScoreLabel(null)
    setSelectedStatus((prev) => (prev === status ? null : status))
  }

  function handleScoreClick(label: string) {
    setSelectedStatus(null)
    setSelectedScoreLabel((prev) => (prev === label ? null : label))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Analitik</h1>
        <p className="text-sm text-white/50">Bir satıra tıkla, detayları sağ panelde gör</p>
      </div>

      {/* Özet metrikler */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Toplam Başvuru" value={total} />
        <StatCard
          label="Mülakat Oranı"
          value={`%${interviewRate}`}
          sub={`${byStatus.interview + byStatus.offer} başvurudan`}
        />
        <StatCard label="Teklif Oranı" value={`%${offerRate}`} sub={`${byStatus.offer} teklif`} />
        <StatCard
          label="Ort. Uyum Skoru"
          value={avgScore !== null ? `%${avgScore}` : '—'}
          sub={maxScore !== null ? `En yüksek: %${maxScore}` : undefined}
        />
      </div>

      <div className={`grid gap-6 ${showPanel ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
        {/* Sol: grafikler */}
        <div className={`space-y-6 ${showPanel ? 'lg:col-span-2' : ''}`}>
          {/* Durum dağılımı */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-white">Durum Dağılımı</h2>
              <span className="text-xs text-white/40">(tıkla → detay)</span>
            </div>
            {total === 0 ? (
              <p className="text-sm text-white/40">Henüz başvuru yok.</p>
            ) : (
              <div className="space-y-1">
                {STATUS_ROWS.map(({ status, label, color }) => (
                  <MiniBar
                    key={status}
                    label={label}
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
              <h2 className="text-sm font-semibold text-white">Aylık Başvuru Trendi</h2>
            </div>
            {total === 0 ? (
              <p className="text-sm text-white/40">Henüz başvuru yok.</p>
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
              <h2 className="text-sm font-semibold text-white">Uyum Skoru Dağılımı</h2>
              <span className="text-xs text-white/40">(tıkla → detay)</span>
            </div>
            {scores.length === 0 ? (
              <p className="text-sm text-white/40">Henüz uyum skoru hesaplanmamış.</p>
            ) : (
              <div className="space-y-1">
                {SCORE_ROWS.map((row) => (
                  <MiniBar
                    key={row.label}
                    label={row.label}
                    count={scores.filter(row.filter).length}
                    total={scores.length}
                    color={row.color}
                    selected={selectedScoreLabel === row.label}
                    onClick={() => handleScoreClick(row.label)}
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
                  onClick={() => { setSelectedStatus(null); setSelectedScoreLabel(null) }}
                  className="text-white/40 hover:text-white/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {panelApps.length === 0 ? (
                <p className="text-sm text-white/40">Bu kategoride başvuru yok.</p>
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
                          <p className="mt-0.5 text-xs text-amber-400">Uyum: %{a.fit_score}</p>
                        )}
                      </div>
                      <Badge className={`ml-2 mt-0.5 shrink-0 ${STATUS_BADGE_CLASSES[a.status]}`}>
                        {STATUS_LABELS[a.status]}
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
