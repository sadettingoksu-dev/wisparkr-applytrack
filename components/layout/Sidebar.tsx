'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { LayoutDashboard, Kanban, FileText, CalendarDays, Settings, CreditCard, LogOut, BarChart2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/utils/constants'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analytics', label: 'Analitik', icon: BarChart2 },
  { href: '/calendar', label: 'Takvim', icon: CalendarDays },
  { href: '/board', label: 'Kanban Board', icon: Kanban },
  { href: '/applications', label: 'Başvurular', icon: FileText },
  { href: '/settings', label: 'Ayarlar', icon: Settings },
  { href: '/settings/billing', label: 'Plan & Faturalama', icon: CreditCard },
]

export function Sidebar({ email }: { email?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-100 bg-white">
      <div className="border-b border-slate-100 px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Wisparkr" width={28} height={28} className="rounded-lg" />
          <span className="text-xl font-bold text-purple-600">{APP_NAME}</span>
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
                  ? 'bg-purple-50 text-purple-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-slate-100 px-3 py-4">
        {email && <p className="mb-2 truncate px-3 text-xs text-slate-400">{email}</p>}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-red-500"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>
  )
}
