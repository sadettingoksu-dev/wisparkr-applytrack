import Link from 'next/link'
import { Briefcase, MessageSquare, Trophy, TrendingUp, Send, ListChecks } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Card } from '@/components/ui/Card'
import { generateTasks, type PlannerTaskKind } from '@/lib/planner'
import type { Application } from '@/lib/types'

const TASK_ICONS: Record<PlannerTaskKind, typeof Send> = {
  interview_prep: MessageSquare,
  follow_up: Send,
  fit_score: TrendingUp,
}

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

  const tasks = generateTasks(apps)

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

      <div>
        <div className="mb-3 flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-800">Yapılacaklar</h2>
        </div>

        {tasks.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">Harika, bekleyen bir işin yok!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const Icon = TASK_ICONS[task.kind]
              return (
                <Link key={task.id} href={task.href}>
                  <Card className="flex items-center gap-3 transition-shadow hover:shadow-lg">
                    <Icon className="h-5 w-5 flex-shrink-0 text-purple-600" />
                    <p className="text-sm font-medium text-slate-800">{task.label}</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
