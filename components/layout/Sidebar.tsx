'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { LayoutDashboard, Kanban, FileText, Files, FilePlus, CalendarDays, Settings, CreditCard, GraduationCap, Bot, Mic, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { UserMenu } from '@/components/layout/UserMenu'
import { useI18n } from '@/components/i18n/I18nProvider'
import { APP_NAME } from '@/utils/constants'
import type { PlanId } from '@/lib/plans'

type NavLeaf = { href: string; key: string; icon: LucideIcon }
type NavGroup = { key: string; icon: LucideIcon; children: NavLeaf[] }
type NavItem = NavLeaf | NavGroup

// Analitik dashboard'a taşındı; takvim ayrı kaldı.
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/calendar', key: 'calendar', icon: CalendarDays },
  { href: '/board', key: 'board', icon: Kanban },
  { href: '/applications', key: 'applications', icon: FileText },
  {
    key: 'careerCoach',
    icon: GraduationCap,
    children: [
      { href: '/assistant', key: 'assistant', icon: Bot },
      { href: '/interview', key: 'interviewSim', icon: Mic },
    ],
  },
  { href: '/cv-builder', key: 'cvBuilder', icon: FilePlus },
  { href: '/documents', key: 'documents', icon: Files },
  { href: '/settings/billing', key: 'billing', icon: CreditCard },
  { href: '/settings', key: 'settings', icon: Settings },
]

const STORAGE_KEY = 'wisparkr-sidebar-collapsed'

/** Daraltma yalnızca masaüstünde anlamlı; mobil drawer her zaman tam görünür. */
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return isDesktop
}

interface SidebarProps {
  name?: string
  email?: string
  avatarUrl?: string | null
  plan?: PlanId | string | null
  /** Mobil drawer açık mı (masaüstünde yok sayılır). */
  mobileOpen?: boolean
  /** Mobilde drawer'ı kapat (link tıklama / arka plana dokunma). */
  onMobileClose?: () => void
}

export function Sidebar({ name, email, avatarUrl, plan, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const isDesktop = useIsDesktop()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  // i18n etiketi (NAV_ITEMS anahtarları string olduğundan güvenli erişim).
  const navLabel = (key: string) => (t.sidebar as Record<string, string>)[key]

  // Kullanıcının daraltma tercihini hatırla.
  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === '1')
  }, [])

  // Daraltma yalnızca masaüstünde uygulanır; mobil drawer tam genişlik gösterir.
  const effCollapsed = isDesktop && collapsed

  function toggle() {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  return (
    <>
      {/* Mobil arka plan örtüsü */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          aria-hidden
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-[transform,width] duration-200 lg:static lg:z-auto lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          effCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Logo → ana sayfa (wisparkr.com); yanındaki ok sidebar'ı daraltır/genişletir */}
        <div className={clsx('border-b border-slate-200 py-5', effCollapsed ? 'px-3' : 'px-6')}>
          <div className={clsx('flex items-center', effCollapsed ? 'flex-col gap-3' : 'gap-2')}>
            <Link
              href="/"
              onClick={onMobileClose}
              title={APP_NAME}
              aria-label={APP_NAME}
              className={clsx('flex min-w-0 items-center gap-2', !effCollapsed && 'flex-1')}
            >
              <Image src="/logo.png" alt="Wisparkr" width={28} height={28} className="shrink-0 rounded-lg" />
              {!effCollapsed && <span className="truncate text-xl font-bold text-purple-600">{APP_NAME}</span>}
            </Link>
            {isDesktop && (
              <button
                onClick={toggle}
                aria-label="Menüyü daralt/genişlet"
                title={effCollapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                {effCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            // Tekil link (alt menüsü olmayan)
            if (!('children' in item)) {
              const { href, key, icon: Icon } = item
              const active = pathname === href
              const label = navLabel(key)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onMobileClose}
                  title={effCollapsed ? label : undefined}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    effCollapsed && 'justify-center',
                    active
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!effCollapsed && label}
                </Link>
              )
            }

            // Açılır grup (ör. Kariyer Koçu → AI Asistan, Mülakat Simülatörü)
            const { key, icon: Icon, children } = item
            const groupActive = children.some((c) => pathname === c.href)

            const renderChild = (child: NavLeaf) => {
              const active = pathname === child.href
              const ChildIcon = child.icon
              const childLabel = navLabel(child.key)
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onMobileClose}
                  title={effCollapsed ? childLabel : undefined}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    effCollapsed ? 'justify-center' : 'pl-9',
                    active
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <ChildIcon className="h-4 w-4 shrink-0" />
                  {!effCollapsed && childLabel}
                </Link>
              )
            }

            // Daraltılmış sidebar: grubu açıp kapamak yerine çocukları düz ikon göster.
            if (effCollapsed) {
              return <div key={key} className="space-y-1">{children.map(renderChild)}</div>
            }

            const open = openGroups[key] ?? groupActive
            return (
              <div key={key}>
                <button
                  onClick={() => setOpenGroups((p) => ({ ...p, [key]: !open }))}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    groupActive
                      ? 'text-purple-600'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{navLabel(key)}</span>
                  <ChevronDown
                    className={clsx('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
                  />
                </button>
                {open && <div className="mt-1 space-y-1">{children.map(renderChild)}</div>}
              </div>
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
            collapsed={effCollapsed}
          />
        </div>
      </aside>
    </>
  )
}
