'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'

/**
 * Kompakt açık/koyu tema anahtarı (navbar için). <html>'e 'dark' sınıfını
 * ekler/çıkarır, tercihi localStorage'a yazar ve geçici 'theme-transition'
 * sınıfıyla yumuşak renk geçişi uygular. İlk durum, layout'taki flash-önleyici
 * script tarafından <html>'e işlendiği için mount'ta oradan okunur.
 */
export function ThemeToggleButton() {
  const { t } = useI18n()
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    setMounted(true)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    const root = document.documentElement
    root.classList.add('theme-transition')
    window.setTimeout(() => root.classList.remove('theme-transition'), 300)
    root.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      /* yoksay */
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={mounted && dark ? t.userMenu.lightMode : t.userMenu.darkMode}
      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-slate-600 transition-colors hover:bg-slate-50"
    >
      {/* mount öncesi ikon sabit kalsın (hydration uyumu) */}
      {mounted && dark ? <Sun className="h-3.5 w-3.5 text-slate-400" /> : <Moon className="h-3.5 w-3.5 text-slate-400" />}
    </button>
  )
}
