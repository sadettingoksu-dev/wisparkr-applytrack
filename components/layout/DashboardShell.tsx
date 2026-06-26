'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import type { PlanId } from '@/lib/plans'

interface DashboardShellProps {
  name: string
  email: string
  avatarUrl: string | null
  plan: PlanId | string | null
  children: React.ReactNode
}

/**
 * Dashboard kabuğu. Masaüstünde sidebar sabit; mobilde hamburger ile açılan
 * kaydırmalı (drawer) sidebar. İçerik padding'i mobilde küçük, masaüstünde geniş.
 */
export function DashboardShell({ name, email, avatarUrl, plan, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        name={name}
        email={email}
        avatarUrl={avatarUrl}
        plan={plan}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Üst bar: mobilde hamburger, her zaman bildirim zili */}
        <div className="flex items-center gap-3 px-4 py-3 sm:px-8 sm:py-4">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menü"
            className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto">
            <NotificationBell />
          </div>
        </div>
        <main className="px-4 pb-8 sm:px-8">{children}</main>
      </div>
    </div>
  )
}
