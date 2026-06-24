import { cookies } from 'next/headers'
import { getDictionary, LOCALE_COOKIE, normalizeLocale, type Locale } from './i18n'

/** Sunucu bileşenlerinde aktif locale'i çerezden okur. */
export function getServerLocale(): Locale {
  return normalizeLocale(cookies().get(LOCALE_COOKIE)?.value)
}

/** Sunucu bileşenlerinde aktif sözlüğü döndürür. */
export function getServerDict() {
  return getDictionary(getServerLocale())
}
