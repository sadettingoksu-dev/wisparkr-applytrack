import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { BarChart2, TrendingUp, Target, Award } from 'lucide-react'
import { STATUS_LABELS } from '@/utils/constants'
import type { Application } from '@/lib/types'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="space-y-1">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </Card>
  )
}

function MiniBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-800">{count} <span className="text-xs text-slate-400">(%{pct})</span></span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default async function AnalyticsPage() {
  const supabase = createClient()
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: true })

  const apps = (applications ?? []) as Application[]
  const total = apps.length

  // Durum dağılımı
  const byStatus = {
    pending: apps.filter((a) => a.status === 'pending').length,
    interview: apps.filter((a) => a.status === 'interview').length,
    offer: apps.filter((a) => a.status === 'offer').length,
    rejected: apps.filter((a) => a.status === 'rejected').length,
  }

  // Dönüşüm oranları
  const interviewRate = total > 0 ? Math.round((byStatus.interview + byStatus.offer) / total * 100) : 0
  const offerRate = total > 0 ? Math.round(byStatus.offer / total * 100) : 0

  // Skor istatistikleri
  const scores = apps.map((a) => a.fit_score).filter((s): s is number => s !== null)
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const maxScore = scores.length ? Math.max(...scores) : null

  // Aylık başvuru (son 6 ay)
  const now = new Date()
  const months: { label: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
    const count = apps.filter((a) => {
      const c = new Date(a.created_at)
      return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
    }).length
    months.push({ label, count })
  }
  const maxMonthCount = Math.max(...months.map((m) => m.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analitik</h1>
        <p className="text-sm text-slate-500">Başvuru performansına genel bakış</p>
      </div>

      {/* Özet metrikler */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Toplam Başvuru" value={total} />
        <StatCard label="Mülakat Oranı" value={`%${interviewRate}`} sub={`${byStatus.interview + byStatus.offer} başvurudan`} />
        <StatCard label="Teklif Oranı" value={`%${offerRate}`} sub={`${byStatus.offer} teklif`} />
        <StatCard
          label="Ort. Uyum Skoru"
          value={avgScore !== null ? `%${avgScore}` : '—'}
          sub={maxScore !== null ? `En yüksek: %${maxScore}` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Durum dağılımı */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-purple-600" />
            <h2 className="text-sm font-semibold text-slate-800">Durum Dağılımı</h2>
          </div>
          {total === 0 ? (
            <p className="text-sm text-slate-400">Henüz başvuru yok.</p>
          ) : (
            <div className="space-y-3">
              <MiniBar label="Beklemede" count={byStatus.pending} total={total} color="bg-purple-400" />
              <MiniBar label="Mülakat" count={byStatus.interview} total={total} color="bg-blue-400" />
              <MiniBar label="Teklif" count={byStatus.offer} total={total} color="bg-emerald-400" />
              <MiniBar label="Reddedildi" count={byStatus.rejected} total={total} color="bg-red-300" />
            </div>
          )}
        </Card>

        {/* Aylık trend */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <h2 className="text-sm font-semibold text-slate-800">Aylık Başvuru Trendi</h2>
          </div>
          {total === 0 ? (
            <p className="text-sm text-slate-400">Henüz başvuru yok.</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {months.map((m) => (
                <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-medium text-slate-600">{m.count || ''}</span>
                  <div
                    className="w-full rounded-t-sm bg-purple-400 transition-all"
                    style={{ height: `${Math.round((m.count / maxMonthCount) * 96)}px`, minHeight: m.count > 0 ? '4px' : '0' }}
                  />
                  <span className="text-xs text-slate-400">{m.label}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Uyum skoru dağılımı */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            <h2 className="text-sm font-semibold text-slate-800">Uyum Skoru Dağılımı</h2>
          </div>
          {scores.length === 0 ? (
            <p className="text-sm text-slate-400">Henüz uyum skoru hesaplanmamış.</p>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Mükemmel (90-100)', count: scores.filter((s) => s >= 90).length, color: 'bg-emerald-500' },
                { label: 'İyi (75-89)', count: scores.filter((s) => s >= 75 && s < 90).length, color: 'bg-blue-400' },
                { label: 'Orta (50-74)', count: scores.filter((s) => s >= 50 && s < 75).length, color: 'bg-amber-400' },
                { label: 'Düşük (0-49)', count: scores.filter((s) => s < 50).length, color: 'bg-red-300' },
              ].map((row) => (
                <MiniBar key={row.label} label={row.label} count={row.count} total={scores.length} color={row.color} />
              ))}
            </div>
          )}
        </Card>

        {/* Son başvurular */}
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-600" />
            <h2 className="text-sm font-semibold text-slate-800">Son 5 Başvuru</h2>
          </div>
          {apps.length === 0 ? (
            <p className="text-sm text-slate-400">Henüz başvuru yok.</p>
          ) : (
            <div className="space-y-2">
              {[...apps].reverse().slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-700">{a.position_title}</p>
                    <p className="truncate text-xs text-slate-400">{a.company_name}</p>
                  </div>
                  <span className={`ml-3 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    a.status === 'offer' ? 'bg-emerald-100 text-emerald-700' :
                    a.status === 'rejected' ? 'bg-red-100 text-red-500' :
                    a.status === 'interview' ? 'bg-blue-100 text-blue-600' :
                    'bg-purple-50 text-purple-600'
                  }`}>
                    {STATUS_LABELS[a.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
