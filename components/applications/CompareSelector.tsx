'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from '@/utils/constants'
import type { Application } from '@/lib/types'

export function CompareSelector({ apps }: { apps: Application[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    )
  }

  function handleCompare() {
    router.push(`/compare?ids=${selected.join(',')}`)
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => setOpen((p) => !p)}>
        <GitCompare className="h-4 w-4" />
        Karşılaştır
      </Button>

      {open && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm space-y-3">
          <p className="text-xs text-white/50">En fazla 3 başvuru seç ({selected.length}/3)</p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {apps.map((a) => {
              const checked = selected.includes(a.id)
              return (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                    checked ? 'border-amber-400 bg-amber-500/10' : 'border-white/10 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(a.id)}
                    disabled={!checked && selected.length >= 3}
                    className="accent-amber-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white/90">{a.position_title}</p>
                    <p className="truncate text-xs text-white/40">{a.company_name}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[a.status]}`}>
                    {STATUS_LABELS[a.status]}
                  </span>
                </label>
              )
            })}
          </div>
          <Button onClick={handleCompare} disabled={selected.length < 2}>
            {selected.length < 2 ? 'En az 2 seç' : `${selected.length} Başvuruyu Karşılaştır`}
          </Button>
        </div>
      )}
    </div>
  )
}
