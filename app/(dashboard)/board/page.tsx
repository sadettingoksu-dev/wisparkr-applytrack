import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { Button } from '@/components/ui/Button'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.board.title}</h1>
          <p className="text-sm text-slate-500">{t.board.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <PageInfo page="board" />
          <Link href="/applications/new">
            <Button>
              <Plus className="h-4 w-4" />
              {t.board.newApplication}
            </Button>
          </Link>
        </div>
      </div>

      <KanbanBoard initialApplications={(applications ?? []) as Application[]} />
    </div>
  )
}
