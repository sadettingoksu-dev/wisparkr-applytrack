'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'

/** Küçük "Kopyala" butonu — sonuç satırlarında (ResultRow) kullanılır. */
export function CopyButton({ text, disabled }: { text: string; disabled?: boolean }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* yoksay */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      disabled={disabled || !text}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? t.common.copied : t.common.copy}
    </button>
  )
}
