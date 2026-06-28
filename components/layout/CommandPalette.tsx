'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  LayoutDashboard,
  FileText,
  Kanban,
  CalendarDays,
  FilePlus,
  Files,
  Bot,
  Mic,
  Settings,
  CreditCard,
  Plus,
  CornerDownLeft,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'

type Item = { label: string; href: string; icon: LucideIcon; group: 'actions' | 'pages' }

/**
 * Komut paleti — Cmd/Ctrl+K ile açılır. Sayfalar arası hızlı gezinme ve
 * "yeni başvuru" gibi hızlı işlemler. Ok tuşları + Enter ile kullanılır.
 */
export function CommandPalette() {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const items: Item[] = useMemo(
    () => [
      { label: t.commandPalette.newApplication, href: '/applications/new', icon: Plus, group: 'actions' },
      { label: t.sidebar.dashboard, href: '/dashboard', icon: LayoutDashboard, group: 'pages' },
      { label: t.sidebar.applications, href: '/applications', icon: FileText, group: 'pages' },
      { label: t.sidebar.board, href: '/board', icon: Kanban, group: 'pages' },
      { label: t.sidebar.calendar, href: '/calendar', icon: CalendarDays, group: 'pages' },
      { label: t.sidebar.cvBuilder, href: '/cv-builder', icon: FilePlus, group: 'pages' },
      { label: t.sidebar.documents, href: '/documents', icon: Files, group: 'pages' },
      { label: t.sidebar.assistant, href: '/assistant', icon: Bot, group: 'pages' },
      { label: t.sidebar.interviewSim, href: '/interview', icon: Mic, group: 'pages' },
      { label: t.sidebar.settings, href: '/settings', icon: Settings, group: 'pages' },
      { label: t.sidebar.billing, href: '/settings/billing', icon: CreditCard, group: 'pages' },
    ],
    [t],
  )

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr')
    if (!q) return items
    return items.filter((i) => i.label.toLocaleLowerCase('tr').includes(q))
  }, [items, query])

  // Cmd/Ctrl+K aç-kapat + üst bardaki düğmeden tetiklenen özel event.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    function onOpen() {
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wisparkr:cmdk', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wisparkr:cmdk', onOpen)
    }
  }, [])

  // Açıldığında girişe odaklan ve durumu sıfırla.
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  function go(item: Item | undefined) {
    if (!item) return
    setOpen(false)
    router.push(item.href)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh]"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(results.length - 1, a + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(0, a - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                go(results[active])
              }
            }}
            placeholder={t.commandPalette.placeholder}
            className="w-full py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-400">{t.commandPalette.empty}</p>
          ) : (
            results.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={item.href}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    i === active ? 'bg-purple-50 text-purple-700' : 'text-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-purple-400" />}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
