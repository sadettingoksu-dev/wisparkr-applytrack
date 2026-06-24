'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'

export default function CheckoutRedirectPage() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (plan !== 'pro' && plan !== 'career_coach') {
      router.replace('/dashboard')
      return
    }

    fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok) {
          setError(json.error?.message ?? t.checkout.error)
          return
        }
        window.location.href = json.data.checkout_url
      })
      .catch(() => setError(t.common.connectionError))
  }, [plan, router, t])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm text-red-400">{error}</p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm text-purple-600 hover:text-purple-700">
              {t.checkout.backToDashboard}
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-purple-600" />
            <p className="mt-4 text-sm text-slate-500">{t.checkout.redirecting}</p>
          </>
        )}
      </div>
    </div>
  )
}
