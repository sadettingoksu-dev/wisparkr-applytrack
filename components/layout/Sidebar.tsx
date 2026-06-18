'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { LayoutDashboard, Kanban, FileText, Files, FilePlus, CalendarDays, Settings, CreditCard, BarChart2 } from 'lucide-react'
import { UserMenu } from '@/components/layout/UserMenu'
import { APP_NAME } from '@/utils/constants'
import type { PlanId } from '@/lib/plans'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analitik', icon: BarChart2 },
  { href: '/calendar', label: 'Takvim', icon: CalendarDays },
  { href: '/board', label: 'Kanban Board', icon: Kanban },
  { href: '/applications', label: 'Başvurular', icon: FileText },
  { href: '/cv-builder', label: 'CV Oluştur', icon: FilePlus },
  { href: '/documents', label: 'Belgelerim', icon: Files },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
  { href: '/settings/billing', label: 'Plan & Faturalama', icon: CreditCard },
]

interface SidebarProps {
  name?: string
  email?: string
  avatarUrl?: string | null
  plan?: PlanId | string | null
}

export function Sidebar({ name, email, avatarUrl, plan }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-white/10 bg-white/5">
      <div className="border-b border-white/10 px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-dark.png" alt="Wisparkr" width={28} height={28} className="rounded-lg" />
          <span className="text-xl font-bold text-amber-500">{APP_NAME}</span>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
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
