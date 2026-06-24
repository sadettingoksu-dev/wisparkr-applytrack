'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_LOCALE, getDictionary, type Dictionary, type Locale } from '@/lib/i18n'

interface I18nValue {
  locale: Locale
  t: Dictionary
}

const I18nContext = createContext<I18nValue>({
  locale: DEFAULT_LOCALE,
  t: getDictionary(DEFAULT_LOCALE),
})

/**
 * Sunucuda okunan locale'i alır ve sözlüğü tüm istemci bileşenlerine dağıtır.
 * Locale sunucudan geldiği için ilk render'da hydration uyumsuzluğu olmaz.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, t: getDictionary(locale) }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  return useContext(I18nContext)
}
