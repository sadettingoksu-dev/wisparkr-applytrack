'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

/**
 * Koyu/açık tema anahtarı. <html>'e 'dark' sınıfını ekler/çıkarır ve tercihi
 * localStorage'a yazar. İlk durum, layout'taki flash-önleyici script tarafından
 * zaten <html>'e işlendiği için mount'ta oradan okunur.
 */
export function ThemeToggle({ labelDark, labelLight }: { labelDark: string; labelLight: string }) {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
    setMounted(true)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      /* yoksay */
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
    >
      {/* mount öncesi ikon sabit kalsın (hydration uyumu) */}
      {mounted && dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {mounted && dark ? labelLight : labelDark}
    </button>
  )
}
