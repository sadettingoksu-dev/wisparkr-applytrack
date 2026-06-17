'use client'

import Link from 'next/link'
import { Zap, X } from 'lucide-react'
import { useState } from 'react'

export function LimitBanner({ used, max }: { used: number; max: number }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  return (
    <div className="flex items-start gap-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
      <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold text-amber-300">
          Ücretsiz plan limitine ulaştın ({used}/{max} başvuru)
        </p>
        <p className="text-xs text-amber-200/70">
          Mevcut başvurularına erişmeye devam edebilirsin. Yeni başvuru eklemek ve tüm AI özelliklerini kullanmak için planını yükselt — yükseltince kaldığın yerden devam edersin.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 mt-1"
        >
          <Zap className="h-3 w-3" />
          Planları Gör ve Yükselt
        </Link>
      </div>
      <button onClick={() => setDismissed(true)} className="text-amber-400/60 hover:text-amber-300">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
