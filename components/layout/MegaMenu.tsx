'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, LayoutGrid, BookOpen } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { getMarketing } from '@/lib/marketing'

/**
 * paytr tarzı mega-menülü orta navigasyon (yalnızca pazarlama yüzeyleri).
 * - "Ürünler" ve "Kaynaklar" açılır panel; "Fiyatlandırma" düz link.
 * - Bağlantı hedefleri var olan route/çapalardır (marketing.ts) — yeni akış yok.
 * - Erişilebilirlik: hover + focus ile açılır, dışarı tıklama/Escape ile kapanır.
 */
export function MegaMenu() {
  const { t, locale } = useI18n()
  const m = getMarketing(locale)
  const [open, setOpen] = useState<'product' | 'resources' | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const triggerClass = (active: boolean) =>
    `inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 ${
      active ? 'text-purple-600' : 'text-slate-600 hover:text-slate-900'
    }`

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      {/* Ürünler */}
      <div
        className="relative"
        onMouseEnter={() => setOpen('product')}
        onMouseLeave={() => setOpen(null)}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => (v === 'product' ? null : 'product'))}
          aria-expanded={open === 'product'}
          className={triggerClass(open === 'product')}
        >
          {m.menu.product}
          <ChevronDown className={`h-4 w-4 transition-transform ${open === 'product' ? 'rotate-180' : ''}`} />
        </button>
        {open === 'product' && (
          <div className="absolute left-1/2 top-full z-50 w-[34rem] -translate-x-1/2 pt-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-3 shadow-2xl shadow-purple-300/25">
              <div className="mb-1 flex items-center gap-2 px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <LayoutGrid className="h-3.5 w-3.5 text-purple-500" />
                {m.menu.productDesc}
              </div>
              <div className="grid grid-cols-2 gap-1">
                {m.menu.productLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(null)}
                    className="group rounded-xl px-3 py-2.5 transition-colors hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                  >
                    <p className="text-sm font-semibold text-slate-800 group-hover:text-purple-700">{link.label}</p>
                    <p className="mt-0.5 text-xs leading-snug text-slate-500">{link.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fiyatlandırma — düz link */}
      <Link
        href="/pricing"
        className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
      >
        {t.nav.pricing}
      </Link>

      {/* Kaynaklar */}
      <div
        className="relative"
        onMouseEnter={() => setOpen('resources')}
        onMouseLeave={() => setOpen(null)}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => (v === 'resources' ? null : 'resources'))}
          aria-expanded={open === 'resources'}
          className={triggerClass(open === 'resources')}
        >
          {m.menu.resources}
          <ChevronDown className={`h-4 w-4 transition-transform ${open === 'resources' ? 'rotate-180' : ''}`} />
        </button>
        {open === 'resources' && (
          <div className="absolute left-1/2 top-full z-50 w-64 -translate-x-1/2 pt-3">
            <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl shadow-purple-300/25">
              <div className="mb-1 flex items-center gap-2 px-3 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <BookOpen className="h-3.5 w-3.5 text-purple-500" />
                {m.menu.resourcesDesc}
              </div>
              {m.menu.resourceLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(null)}
                  className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-purple-50 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
