'use client'

import { useState } from 'react'
import { DndContext, type DragEndEvent } from '@dnd-kit/core'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { KANBAN_COLUMNS } from '@/utils/constants'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { Application, ApplicationStatus } from '@/lib/types'

export function KanbanBoard({ initialApplications }: { initialApplications: Application[] }) {
  const { t } = useI18n()
  const [applications, setApplications] = useState(initialApplications)

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const newStatus = over.id as ApplicationStatus
    const appId = active.id as string

    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app))
    )

    await fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            label={t.status[column.id]}
            applications={applications.filter((app) => app.status === column.id)}
          />
        ))}
      </div>
    </DndContext>
  )
}
