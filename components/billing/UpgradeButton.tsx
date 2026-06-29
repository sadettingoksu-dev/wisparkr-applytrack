'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { PlanId } from '@/lib/types'

export function UpgradeButton({
  planId,
  label,
  variant,
  fullWidth,
}: {
  planId: Exclude<PlanId, 'free'>
  label?: string
  variant?: 'primary' | 'secondary'
  fullWidth?: boolean
}) {
  const { t } = useI18n()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.common.error)
        return
      }
      window.location.href = json.data.checkout_url
    } catch {
      setError(t.common.connectionError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={fullWidth ? 'w-full space-y-1' : 'space-y-1'}>
      <Button
        onClick={handleUpgrade}
        disabled={loading}
        variant={variant}
        className={fullWidth ? 'w-full' : undefined}
      >
        {loading ? <Spinner /> : <><Zap className="h-3.5 w-3.5" />{label ?? t.billing.upgrade}</>}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
