'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GitCompare } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { STATUS_BADGE_CLASSES } from '@/utils/constants'
import { useI18n } from '@/components/i18n/I18nProvider'
import { format } from '@/lib/i18n'
import type { Application } from '@/lib/types'

export function CompareSelector({ apps }: { apps: Application[] }) {
  const { t } = useI18n()
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
        {t.appDetail.compare}
      </Button>

      {open && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
          <p className="text-xs text-slate-500">{format(t.appDetail.compareHint, { n: selected.length })}</p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {apps.map((a) => {
              const checked = selected.includes(a.id)
              return (
                <label
                  key={a.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                    checked ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(a.id)}
                    disabled={!checked && selected.length >= 3}
                    className="accent-purple-600"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{a.position_title}</p>
                    <p className="truncate text-xs text-slate-400">{a.company_name}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASSES[a.status]}`}>
                    {t.status[a.status]}
                  </span>
                </label>
              )
            })}
          </div>
          <Button onClick={handleCompare} disabled={selected.length < 2}>
            {selected.length < 2 ? t.appDetail.compareMin : format(t.appDetail.compareCta, { n: selected.length })}
          </Button>
        </div>
      )}
    </div>
  )
}
