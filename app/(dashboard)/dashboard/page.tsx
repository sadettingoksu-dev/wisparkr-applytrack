import { Briefcase, MessageSquare, Trophy, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/dashboard/MetricCard'
import type { Application } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: applications } = await supabase.from('applications').select('*')
  const apps = (applications ?? []) as Application[]

  const total = apps.length
  const inInterview = apps.filter((a) => a.status === 'interview').length
  const offers = apps.filter((a) => a.status === 'offer').length
  const scores = apps.map((a) => a.fit_score).filter((s): s is number => s !== null)
  const avgScore = scores.length
    ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500">Başvurularına genel bakış</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Toplam Başvuru" value={total} icon={Briefcase} />
        <MetricCard label="Mülakat Aşamasında" value={inInterview} icon={MessageSquare} />
        <MetricCard label="Teklifler" value={offers} icon={Trophy} />
        <MetricCard
          label="Ortalama Uyum Skoru"
          value={avgScore !== null ? `%${avgScore}` : '—'}
          icon={TrendingUp}
        />
      </div>
    </div>
  )
}
