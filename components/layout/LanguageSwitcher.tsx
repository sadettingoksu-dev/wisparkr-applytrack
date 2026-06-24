'use client'

import { useRouter } from 'next/navigation'
import { LOCALES, LOCALE_COOKIE, type Locale } from '@/lib/i18n'
import { useI18n } from '@/components/i18n/I18nProvider'

const LABELS: Record<Locale, string> = { tr: 'TR', en: 'EN' }

/** Navbar'daki TR/EN dil seçici. Seçimi çereze yazıp sunucuyu yeniler. */
export function LanguageSwitcher() {
  const router = useRouter()
  const { locale } = useI18n()

  function setLocale(next: Locale) {
    if (next === locale) return
    // 1 yıl geçerli, tüm site genelinde
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    router.refresh()
  }

  return (
    <div className="inline-flex items-center rounded-full border border-white/15 bg-white/5 p-0.5 text-xs font-medium">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            l === locale ? 'bg-amber-500 text-black' : 'text-white/60 hover:text-white'
          }`}
          aria-pressed={l === locale}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  )
}
