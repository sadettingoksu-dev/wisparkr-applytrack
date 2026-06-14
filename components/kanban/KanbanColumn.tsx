import { useDroppable } from '@dnd-kit/core'
import { ApplicationCard } from '@/components/kanban/ApplicationCard'
import type { Application, ApplicationStatus } from '@/lib/types'

interface KanbanColumnProps {
  id: ApplicationStatus
  label: string
  applications: Application[]
}

export function KanbanColumn({ id, label, applications }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[400px] w-full flex-col gap-3 rounded-lg border p-3 transition-colors ${
        isOver ? 'border-purple-600 bg-purple-50' : 'border-slate-100 bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
        <span className="text-xs text-slate-400">{applications.length}</span>
      </div>
      {applications.map((app) => (
        <ApplicationCard key={app.id} application={app} />
      ))}
      {applications.length === 0 && (
        <p className="px-1 text-xs text-slate-400">Henüz başvuru yok.</p>
      )}
    </div>
  )
}
