import { Kanban } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageInfo } from '@/components/ui/PageInfo'
import { getServerDict } from '@/lib/i18n-server'
import type { Application } from '@/lib/types'

export default async function BoardPage() {
  const t = getServerDict()
  const supabase = createClient()
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  const apps = (applications ?? []) as Application[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.board.title}</h1>
          <p className="text-sm text-slate-500">{t.board.subtitle}</p>
        </div>
        <PageInfo page="board" />
      </div>

      {apps.length === 0 ? (
        <EmptyState
          icon={Kanban}
          title={t.board.empty}
          description={t.board.emptyDesc}
          ctaLabel={t.board.newApplication}
          ctaHref="/applications/new"
        />
      ) : (
        <KanbanBoard initialApplications={apps} />
      )}
    </div>
  )
}
