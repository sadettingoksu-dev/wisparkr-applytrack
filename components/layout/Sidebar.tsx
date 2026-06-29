'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { LayoutDashboard, Kanban, FileText, Files, FilePlus, CalendarDays, Settings, CreditCard, GraduationCap, Bot, Mic, ChevronDown, Lock, Briefcase } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { UserMenu } from '@/components/layout/UserMenu'
import { useI18n } from '@/components/i18n/I18nProvider'
import { APP_NAME } from '@/utils/constants'
import { getPlan, type PlanId, type FeatureKey } from '@/lib/plans'

type NavLeaf = { href: string; key: string; icon: LucideIcon; feature?: FeatureKey }
type NavGroup = { key: string; icon: LucideIcon; children: NavLeaf[] }
type NavItem = NavLeaf | NavGroup

// Analitik dashboard'a taşındı; takvim ayrı kaldı.
// `feature` taşıyan öğeler, kullanıcının efektif planı o özelliği içermiyorsa
// sönükleşir ve tıklanınca faturalama sayfasına yönlendirir.
const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/calendar', key: 'calendar', icon: CalendarDays },
  { href: '/board', key: 'board', icon: Kanban },
  { href: '/applications', key: 'applications', icon: FileText },
  { href: '/jobs', key: 'jobs', icon: Briefcase },
  {
    key: 'careerCoach',
    icon: GraduationCap,
    children: [
      { href: '/interview', key: 'interviewSim', icon: Mic, feature: 'mockInterview' },
      { href: '/assistant', key: 'assistant', icon: Bot, feature: 'aiAssistant' },
    ],
  },
  { href: '/cv-builder', key: 'cvBuilder', icon: FilePlus },
  { href: '/documents', key: 'documents', icon: Files },
  { href: '/settings/billing', key: 'billing', icon: CreditCard },
  { href: '/settings', key: 'settings', icon: Settings },
]

const BILLING_HREF = '/settings/billing'

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
  /** Efektif plan (deneme yükseltmesi dahil) — özellik kilitlerini belirler. */
  effectivePlan?: PlanId | string | null
  /** Mobil drawer açık mı (masaüstünde yok sayılır). */
  mobileOpen?: boolean
  /** Mobilde drawer'ı kapat (link tıklama / arka plana dokunma). */
  onMobileClose?: () => void
}

export function Sidebar({ name, email, avatarUrl, plan, effectivePlan, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const isDesktop = useIsDesktop()
  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  // i18n etiketi (NAV_ITEMS anahtarları string olduğundan güvenli erişim).
  const navLabel = (key: string) => (t.sidebar as Record<string, string>)[key]

  // Efektif planın özellikleri: bir öğenin kilitli olup olmadığını belirler.
  const planFeatures = getPlan(effectivePlan ?? plan).features
  const isLocked = (item: { feature?: FeatureKey }) => !!item.feature && !planFeatures[item.feature]

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
        {/* Logoya basınca sidebar daralır/açılır (masaüstü) */}
        <div className={clsx('border-b border-slate-200 py-5', effCollapsed ? 'px-3' : 'px-6')}>
          <button
            onClick={toggle}
            title={effCollapsed ? t.sidebar.dashboard : APP_NAME}
            aria-label="Menüyü daralt/genişlet"
            className="flex w-full items-center gap-2"
          >
            <Image src="/logo.png" alt="Wisparkr" width={28} height={28} className="shrink-0 rounded-lg" />
            {!effCollapsed && <span className="text-xl font-bold text-purple-600">{APP_NAME}</span>}
          </button>
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
              const locked = isLocked(child)
              const active = !locked && pathname === child.href
              const ChildIcon = child.icon
              const childLabel = navLabel(child.key)
              // Kilitliyse: tıklayınca özelliği aç(tır)mak için faturalama sayfasına git.
              const lockTitle = `${childLabel} — ${t.sidebar.locked}`
              return (
                <Link
                  key={child.href}
                  href={locked ? BILLING_HREF : child.href}
                  onClick={onMobileClose}
                  title={locked ? lockTitle : effCollapsed ? childLabel : undefined}
                  aria-disabled={locked}
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    effCollapsed ? 'justify-center' : 'pl-9',
                    locked
                      ? 'text-slate-300 hover:bg-slate-50 hover:text-slate-400'
                      : active
                        ? 'bg-purple-50 text-purple-600'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <ChildIcon className="h-4 w-4 shrink-0" />
                  {!effCollapsed && <span className="flex-1">{childLabel}</span>}
                  {!effCollapsed && locked && <Lock className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
                </Link>
              )
            }

            // Daraltılmış sidebar: grubu açıp kapamak yerine çocukları düz ikon göster.
            if (effCollapsed) {
              return <div key={key} className="space-y-1">{children.map(renderChild)}</div>
            }

            // İçinde kilitli özellik varsa grubu varsayılan açık tut (upsell görünür olsun).
            const hasLocked = children.some(isLocked)
            const open = openGroups[key] ?? (groupActive || hasLocked)
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
