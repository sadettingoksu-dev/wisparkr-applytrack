'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { LOCALES, LOCALE_COOKIE, type Locale } from '@/lib/i18n'
import { useI18n } from '@/components/i18n/I18nProvider'

// Kısa kod (tetikleyicide) + tam ad (açılır listede).
const SHORT: Record<Locale, string> = { tr: 'TR', en: 'EN', de: 'DE', es: 'ES', fr: 'FR' }
const NAMES: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
}

/** Tek butonlu dil seçici: basınca açılır, dil seçilince çereze yazıp sunucuyu yeniler. */
export function LanguageSwitcher() {
  const router = useRouter()
  const { locale } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [])

  function setLocale(next: Locale) {
    setOpen(false)
    if (next === locale) return
    // 1 yıl geçerli, tüm site genelinde
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    router.refresh()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Dil seç"
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <Globe className="h-3.5 w-3.5 text-slate-400" />
        {SHORT[locale]}
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-300/40"
        >
          {LOCALES.map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={l === locale}
              onClick={() => setLocale(l)}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm transition-colors ${
                l === locale
                  ? 'font-medium text-purple-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400">{SHORT[l]}</span>
                {NAMES[l]}
              </span>
              {l === locale && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
