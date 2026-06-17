'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { STATUS_LABELS, STATUS_BADGE_CLASSES, KANBAN_COLUMNS } from '@/utils/constants'
import type { ApplicationStatus } from '@/lib/types'

export function StatusSelector({ applicationId, initialStatus }: { applicationId: string; initialStatus: ApplicationStatus }) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleSelect(newStatus: ApplicationStatus) {
    if (newStatus === status) { setOpen(false); return }
    setLoading(true)
    setOpen(false)
    try {
      await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setStatus(newStatus)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((p) => !p)} disabled={loading} className="flex items-center gap-1.5">
        {loading ? <Spinner /> : (
          <Badge className={`${STATUS_BADGE_CLASSES[status]} cursor-pointer hover:opacity-80`}>
            {STATUS_LABELS[status]} ▾
          </Badge>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-white/10 bg-white/5 shadow-lg">
          {KANBAN_COLUMNS.map((col) => (
            <button
              key={col.id}
              onClick={() => handleSelect(col.id)}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 ${col.id === status ? 'font-semibold' : ''}`}
            >
              <span className={`h-2 w-2 rounded-full ${STATUS_BADGE_CLASSES[col.id].split(' ')[0]}`} />
              {col.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
