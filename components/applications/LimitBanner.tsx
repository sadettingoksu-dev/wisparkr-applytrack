'use client'

import Link from 'next/link'
import { Zap, X } from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { format } from '@/lib/i18n'

export function LimitBanner({ used, max }: { used: number; max: number }) {
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="flex items-start gap-4 rounded-xl border border-purple-500/20 bg-purple-50 px-4 py-3">
      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-purple-700">
          {format(t.limitBanner.title, { used, max })}
        </p>
        <p className="text-xs text-slate-600">
          {t.limitBanner.desc}
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 mt-1"
        >
          <Zap className="h-3 w-3" />
          {t.limitBanner.cta}
        </Link>
      </div>
      <button onClick={() => setDismissed(true)} className="text-purple-600/60 hover:text-purple-700">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
