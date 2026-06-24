'use client'

import { useState } from 'react'
import { Info, X } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'

type PageKey = keyof ReturnType<typeof useI18n>['t']['pageInfo']

/**
 * Small "i" button shown next to a page title. Clicking it reveals a short
 * explanation of what the user can track / do on that page.
 */
export function PageInfo({ page }: { page: PageKey }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const info = t.pageInfo[page]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={info.title}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-purple-600 transition-colors hover:bg-purple-50"
      >
        <Info className="h-4 w-4" />
      </button>

      {open && (
        <>
          {/* click-outside backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="mb-1.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">{info.title}</h3>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">{info.body}</p>
          </div>
        </>
      )}
    </div>
  )
}
