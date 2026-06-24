'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { XOctagon } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'

export function CancelButton() {
  const { t } = useI18n()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/cancel', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.common.error)
        return
      }
      router.refresh()
    } catch {
      setError(t.common.connectionError)
    } finally {
      setLoading(false)
      setConfirming(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-xs font-medium text-slate-400 transition-colors hover:text-red-500"
      >
        {t.billing.cancelPlan}
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="text-xs text-slate-600">{t.billing.cancelConfirm}</p>
      <div className="flex items-center gap-2">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Spinner /> : <><XOctagon className="h-3.5 w-3.5" />{t.billing.cancelConfirmYes}</>}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          {t.billing.cancelConfirmNo}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
