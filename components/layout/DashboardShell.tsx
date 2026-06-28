'use client'

import { useState } from 'react'
import { Menu, Search } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { ProductTour } from '@/components/dashboard/ProductTour'
import { CommandPalette } from '@/components/layout/CommandPalette'
import type { PlanId } from '@/lib/plans'

interface DashboardShellProps {
  name: string
  email: string
  avatarUrl: string | null
  plan: PlanId | string | null
  children: React.ReactNode
}

/**
 * Dashboard kabuğu.
 * - Masaüstü: kabuk ekran yüksekliğinde sabit; sol sidebar + üst bar sabit kalır,
 *   yalnızca sağdaki içerik alanı (main) kendi içinde kaydırılır.
 * - Mobil: normal sayfa kaydırması; sidebar hamburger ile açılan drawer.
 */
export function DashboardShell({ name, email, avatarUrl, plan, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50 lg:h-screen lg:overflow-hidden">
      <ProductTour />
      <CommandPalette />
      <Sidebar
        name={name}
        email={email}
        avatarUrl={avatarUrl}
        plan={plan}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        {/* Üst bar: mobilde hamburger, her zaman bildirim zili — masaüstünde sabit kalır */}
        <div className="flex shrink-0 items-center gap-3 px-4 py-3 sm:px-8 sm:py-4">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menü"
            className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Komut paletini aç (Cmd/Ctrl+K) */}
          <button
            onClick={() => window.dispatchEvent(new Event('wisparkr:cmdk'))}
            className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-50"
          >
            <Search className="h-4 w-4" />
            <kbd className="hidden text-xs font-medium text-slate-400 sm:inline">Ctrl K</kbd>
          </button>
          <div>
            <NotificationBell />
          </div>
        </div>
        {/* Yalnızca bu alan kaydırılır (masaüstünde) */}
        <main className="px-4 pb-8 sm:px-8 lg:flex-1 lg:overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
