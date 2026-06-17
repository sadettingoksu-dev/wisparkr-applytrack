'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function CheckoutRedirectPage() {
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
          setError(json.error?.message ?? 'Ödeme sayfası açılamadı.')
          return
        }
        window.location.href = json.data.checkout_url
      })
      .catch(() => setError('Bağlantı hatası.'))
  }, [plan, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm text-red-400">{error}</p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm text-amber-400 hover:text-amber-300">
              Dashboard&apos;a dön →
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-400" />
            <p className="mt-4 text-sm text-white/60">Ödeme sayfasına yönlendiriliyorsun...</p>
          </>
        )}
      </div>
    </div>
  )
}
