import { useDroppable } from '@dnd-kit/core'
import { ApplicationCard } from '@/components/kanban/ApplicationCard'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { Application, ApplicationStatus } from '@/lib/types'

interface KanbanColumnProps {
  id: ApplicationStatus
  label: string
  applications: Application[]
}

export function KanbanColumn({ id, label, applications }: KanbanColumnProps) {
  const { t } = useI18n()
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[400px] w-full flex-col gap-3 rounded-lg border p-3 transition-colors ${
        isOver ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-white">{label}</h3>
        <span className="text-xs text-white/40">{applications.length}</span>
      </div>
      {applications.map((app) => (
        <ApplicationCard key={app.id} application={app} />
      ))}
      {applications.length === 0 && (
        <p className="px-1 text-xs text-white/40">{t.board.empty}</p>
      )}
    </div>
  )
}
