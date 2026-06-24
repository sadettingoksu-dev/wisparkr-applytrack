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
    <div className="flex items-start gap-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-amber-300">
          {format(t.limitBanner.title, { used, max })}
        </p>
        <p className="text-xs text-amber-200/70">
          {t.limitBanner.desc}
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 mt-1"
        >
          <Zap className="h-3 w-3" />
          {t.limitBanner.cta}
        </Link>
      </div>
      <button onClick={() => setDismissed(true)} className="text-amber-400/60 hover:text-amber-300">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
