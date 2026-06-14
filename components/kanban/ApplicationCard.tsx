import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate } from '@/utils/format'
import type { Application } from '@/lib/types'

export function ApplicationCard({ application }: { application: Application }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  })
  const score = application.fit_score

  return (
    <Card
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }}
      className="cursor-grab space-y-2 p-4 active:cursor-grabbing"
    >
      <p className="font-semibold text-slate-800">{application.position_title}</p>
      <p className="text-sm text-slate-500">{application.company_name}</p>
      <div className="flex items-center justify-between pt-1">
        {application.applied_at && (
          <span className="text-xs text-slate-400">{formatDate(application.applied_at)}</span>
        )}
        {score !== null && score !== undefined && (
          <Badge className={score >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-50 text-purple-600'}>
            %{score} uyum
          </Badge>
        )}
      </div>
    </Card>
  )
}
