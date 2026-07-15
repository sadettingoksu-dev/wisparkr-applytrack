'use client'

import { useState } from 'react'
import { Menu, Search } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { ProductTour } from '@/components/dashboard/ProductTour'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { getPlan, type PlanId } from '@/lib/plans'

interface DashboardShellProps {
  name: string
  email: string
  avatarUrl: string | null
  plan: PlanId | string | null
  /** Effective plan (trial elevated) — drives sidebar feature locks. */
  effectivePlan?: PlanId | string | null
  children: React.ReactNode
}

/**
 * Dashboard kabuğu.
 * - Masaüstü: kabuk ekran yüksekliğinde sabit; sol sidebar + üst bar sabit kalır,
 *   yalnızca sağdaki içerik alanı (main) kendi içinde kaydırılır.
 * - Mobil: normal sayfa kaydırması; sidebar hamburger ile açılan drawer.
 */
export function DashboardShell({ name, email, avatarUrl, plan, effectivePlan, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const planName = getPlan(plan).name
  const isPaid = plan === 'pro' || plan === 'career_coach'
  const initial = (name || email || '?').trim().charAt(0).toUpperCase()

  return (
    <div className="flex min-h-screen bg-slate-50 lg:h-screen lg:overflow-hidden">
      <ProductTour />
      <CommandPalette />
      <Sidebar
        name={name}
        email={email}
        avatarUrl={avatarUrl}
        plan={plan}
        effectivePlan={effectivePlan}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col lg:overflow-hidden">
        {/* Panel başlığı (paytr tarzı): solda hesap bağlamı, sağda arama + bildirim.
            Masaüstünde sabit; mobilde sticky kalır. */}
        <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur sm:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Menü"
            className="rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Hesap bağlamı — çeviri gerektirmez (isim + plan rozeti) */}
          <div className="flex min-w-0 items-center gap-2.5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
                {initial}
              </span>
            )}
            <div className="hidden min-w-0 leading-tight sm:block">
              <p className="truncate text-sm font-semibold text-slate-900">{name || email}</p>
              <p className="truncate text-xs text-slate-400">{email}</p>
            </div>
            <span
              className={
                'ml-1 hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline-flex ' +
                (isPaid ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500')
              }
            >
              {planName}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Komut paletini aç (Cmd/Ctrl+K) */}
            <button
              onClick={() => window.dispatchEvent(new Event('wisparkr:cmdk'))}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
            >
              <Search className="h-4 w-4" />
              <kbd className="hidden text-xs font-medium text-slate-400 sm:inline">Ctrl K</kbd>
            </button>
            <NotificationBell />
          </div>
        </header>
        {/* Yalnızca bu alan kaydırılır (masaüstünde).
            pb-24: sağ-alttaki geri bildirim widget'ı (bottom-5, ~4rem) sabit
            konumlu olduğu için sayfanın SONU altında kalıyordu. parkrcan daha
            yukarıda (bottom-24 + h-16 → ~10rem) ama yalnızca ana sayfada var;
            oradaki ek boşluğu dashboard/page.tsx kendisi veriyor — aksi halde
            tüm sayfalar gereksiz yere 8rem ölü alan taşıyordu (şablon seçici
            bu yüzden tek ekrana sığmıyordu). Bkz. globals.css katman ölçeği. */}
        <main className="px-4 pb-24 pt-6 sm:px-8 lg:flex-1 lg:overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
