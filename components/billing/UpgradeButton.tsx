'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { PlanId } from '@/lib/types'

export function UpgradeButton({ planId, label }: { planId: Exclude<PlanId, 'free'>; label?: string }) {
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
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      window.location.href = json.data.checkout_url
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <Button onClick={handleUpgrade} disabled={loading}>
        {loading ? <Spinner /> : <><Zap className="h-3.5 w-3.5" />{label ?? 'Planı Yükselt'}</>}
      </Button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
