import { Kanban } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
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
      <PageHeader title={t.board.title} subtitle={t.board.subtitle} infoPage="board" />

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
