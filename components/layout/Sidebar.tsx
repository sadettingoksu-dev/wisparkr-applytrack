'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { LayoutDashboard, Kanban, FileText, Files, FilePlus, CalendarDays, Settings, CreditCard, BarChart2 } from 'lucide-react'
import { UserMenu } from '@/components/layout/UserMenu'
import { useI18n } from '@/components/i18n/I18nProvider'
import { APP_NAME } from '@/utils/constants'
import type { PlanId } from '@/lib/plans'

const NAV_ITEMS = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/analytics', key: 'analytics', icon: BarChart2 },
  { href: '/calendar', key: 'calendar', icon: CalendarDays },
  { href: '/board', key: 'board', icon: Kanban },
  { href: '/applications', key: 'applications', icon: FileText },
  { href: '/cv-builder', key: 'cvBuilder', icon: FilePlus },
  { href: '/documents', key: 'documents', icon: Files },
  { href: '/settings', key: 'settings', icon: Settings },
  { href: '/settings/billing', key: 'billing', icon: CreditCard },
] as const

interface SidebarProps {
  name?: string
  email?: string
  avatarUrl?: string | null
  plan?: PlanId | string | null
}

export function Sidebar({ name, email, avatarUrl, plan }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-white/10 bg-white/5">
      <div className="border-b border-white/10 px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-dark.png" alt="Wisparkr" width={28} height={28} className="rounded-lg" />
          <span className="text-xl font-bold text-amber-500">{APP_NAME}</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => {
          const active = pathname === href
          const label = t.sidebar[key]
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-white/10 p-2">
        <UserMenu
          name={name ?? ''}
          email={email ?? ''}
          avatarUrl={avatarUrl}
          plan={plan}
          variant="sidebar"
        />
      </div>
    </aside>
  )
}
