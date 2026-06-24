'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { LayoutDashboard, Kanban, FileText, Files, FilePlus, CalendarDays, Settings, CreditCard } from 'lucide-react'
import { UserMenu } from '@/components/layout/UserMenu'
import { useI18n } from '@/components/i18n/I18nProvider'
import { APP_NAME } from '@/utils/constants'
import type { PlanId } from '@/lib/plans'

// Analitik dashboard'a taşındı; takvim ayrı kaldı.
const NAV_ITEMS = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/calendar', key: 'calendar', icon: CalendarDays },
  { href: '/board', key: 'board', icon: Kanban },
  { href: '/applications', key: 'applications', icon: FileText },
  { href: '/cv-builder', key: 'cvBuilder', icon: FilePlus },
  { href: '/documents', key: 'documents', icon: Files },
  { href: '/settings', key: 'settings', icon: Settings },
  { href: '/settings/billing', key: 'billing', icon: CreditCard },
] as const

const STORAGE_KEY = 'wisparkr-sidebar-collapsed'

interface SidebarProps {
  name?: string
  email?: string
  avatarUrl?: string | null
  plan?: PlanId | string | null
}

export function Sidebar({ name, email, avatarUrl, plan }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const [collapsed, setCollapsed] = useState(false)

  // Kullanıcının daraltma tercihini hatırla.
  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === '1')
  }, [])

  function toggle() {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <aside
      className={clsx(
        'flex h-screen flex-col border-r border-slate-200 bg-white transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logoya basınca sidebar daralır/açılır */}
      <div className={clsx('border-b border-slate-200 py-5', collapsed ? 'px-3' : 'px-6')}>
        <button
          onClick={toggle}
          title={collapsed ? t.sidebar.dashboard : APP_NAME}
          aria-label="Menüyü daralt/genişlet"
          className="flex w-full items-center gap-2"
        >
          <Image src="/logo.png" alt="Wisparkr" width={28} height={28} className="shrink-0 rounded-lg" />
          {!collapsed && <span className="text-xl font-bold text-purple-600">{APP_NAME}</span>}
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
          const active = pathname === href
          const label = t.sidebar[key]
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center',
                active
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-2">
        <UserMenu
          name={name ?? ''}
          email={email ?? ''}
          avatarUrl={avatarUrl}
          plan={plan}
          variant="sidebar"
          collapsed={collapsed}
        />
      </div>
    </aside>
  )
}
