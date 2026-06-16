'use client'

import Link from 'next/link'
import { Zap, X } from 'lucide-react'
import { useState } from 'react'

export function LimitBanner({ used, max }: { used: number; max: number }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-amber-800">
          Ücretsiz plan limitine ulaştın ({used}/{max} başvuru)
        </p>
        <p className="text-xs text-amber-700">
          Mevcut başvurularına erişmeye devam edebilirsin. Yeni başvuru eklemek ve tüm AI özelliklerini kullanmak için planını yükselt — yükseltince kaldığın yerden devam edersin.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 mt-1"
        >
          <Zap className="h-3 w-3" />
          Planları Gör ve Yükselt
        </Link>
      </div>
      <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
