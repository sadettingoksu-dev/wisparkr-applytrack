import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'
import { getServerLocale } from '@/lib/i18n-server'
import { getMarketing } from '@/lib/marketing'

/**
 * paytr tarzı ince kampanya/duyuru şeridi — hero'nun hemen üstünde.
 * Yalnızca sunum; veri veya akış yok. Metin marketing.ts'ten gelir.
 */
export function PromoBar() {
  const m = getMarketing(getServerLocale())
  return (
    <div className="bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-2 px-6 py-2.5 text-center text-sm sm:flex-row">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 shrink-0 text-white/90" />
          {m.promo.text}
        </span>
        <Link
          href="/signup"
          className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {m.promo.cta}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
