import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { Button } from '@/components/ui/Button'
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
          <h1 className="text-2xl font-bold text-white">{t.board.title}</h1>
          <p className="text-sm text-white/50">{t.board.subtitle}</p>
        </div>
        <Link href="/applications/new">
          <Button>
            <Plus className="h-4 w-4" />
            {t.board.newApplication}
          </Button>
        </Link>
      </div>

      <KanbanBoard initialApplications={(applications ?? []) as Application[]} />
    </div>
  )
}
