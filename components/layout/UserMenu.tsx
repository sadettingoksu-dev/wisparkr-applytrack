'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Settings,
  Sparkles,
  Puzzle,
  HelpCircle,
  Info,
  LogOut,
  ChevronsUpDown,
} from 'lucide-react'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useI18n } from '@/components/i18n/I18nProvider'
import { createClient } from '@/lib/supabase/client'
import { getPlan, type PlanId } from '@/lib/plans'

const HELP_EMAIL = 'info@wisparkr.com'

export interface UserMenuProps {
  name: string
  email: string
  avatarUrl?: string | null
  plan?: PlanId | string | null
  /** sidebar = opens upward (dashboard chrome); navbar = opens downward (marketing site). */
  variant?: 'sidebar' | 'navbar'
  /** Collapsed sidebar: show only the avatar trigger. */
  collapsed?: boolean
}

function Avatar({ name, avatarUrl, size = 28 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-700"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  )
}

export function UserMenu({ name, email, avatarUrl, plan, variant = 'sidebar', collapsed = false }: UserMenuProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const planConfig = getPlan(plan)
  const displayName = name?.trim() || email

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  async function handleSignOut() {
    setBusy(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/')
    router.refresh()
  }

  async function handleSwitchAccount() {
    setBusy(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/dashboard')}`,
        queryParams: { prompt: 'select_account' },
      },
    })
  }

  const canUpgrade = planConfig.id !== 'career_coach'

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      {variant === 'sidebar' && collapsed ? (
        <button
          onClick={() => setOpen((v) => !v)}
          title={displayName}
          className="flex w-full items-center justify-center rounded-lg px-1 py-2 transition-colors hover:bg-slate-100"
        >
          <Avatar name={displayName} avatarUrl={avatarUrl} size={32} />
        </button>
      ) : variant === 'sidebar' ? (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-slate-100"
        >
          <Avatar name={displayName} avatarUrl={avatarUrl} size={32} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-slate-900">{displayName}</span>
            <span className="block truncate text-xs text-slate-400">{planConfig.name} {t.userMenu.planSuffix}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-slate-400" />
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={t.userMenu.accountMenu}
          className="flex items-center rounded-full ring-2 ring-transparent transition hover:ring-purple-300"
        >
          <Avatar name={displayName} avatarUrl={avatarUrl} size={32} />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div
          className={clsx(
            'absolute z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50',
            variant === 'sidebar' ? 'bottom-full left-0 mb-2' : 'right-0 mt-2'
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <Avatar name={displayName} avatarUrl={avatarUrl} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
              <p className="truncate text-xs text-slate-400">{email}</p>
            </div>
          </div>

          {/* Plan badge */}
          <div className="border-b border-slate-200 px-4 py-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
              <Sparkles className="h-3 w-3" />
              {planConfig.name} {t.userMenu.planSuffix}
            </span>
          </div>

          {/* Items */}
          <div className="py-1">
            {variant === 'navbar' && (
              <MenuLink href="/dashboard" icon={LayoutDashboard} label={t.userMenu.goToPanel} onClick={() => setOpen(false)} />
            )}
            <MenuLink href="/settings" icon={Settings} label={t.userMenu.settings} onClick={() => setOpen(false)} />
            {canUpgrade && (
              <MenuLink
                href="/settings/billing"
                icon={Sparkles}
                label={t.userMenu.upgrade}
                accent
                onClick={() => setOpen(false)}
              />
            )}
            <MenuLink
              href="/settings#extension"
              icon={Puzzle}
              label={t.userMenu.extensions}
              onClick={() => setOpen(false)}
            />
            <MenuLink
              href={`mailto:${HELP_EMAIL}`}
              icon={HelpCircle}
              label={t.userMenu.help}
              external
              onClick={() => setOpen(false)}
            />
            <MenuLink href="/#features" icon={Info} label={t.userMenu.moreInfo} onClick={() => setOpen(false)} />
          </div>

          {/* Account actions */}
          <div className="border-t border-slate-200 py-1">
            <ThemeToggle labelDark={t.userMenu.darkMode} labelLight={t.userMenu.lightMode} />
            <button
              onClick={handleSwitchAccount}
              disabled={busy}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            >
              <GoogleIcon className="h-4 w-4" />
              {t.userMenu.switchAccount}
            </button>
            <button
              onClick={handleSignOut}
              disabled={busy}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              {t.userMenu.signOut}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuLink({
  href,
  icon: Icon,
  label,
  accent,
  external,
  onClick,
}: {
  href: string
  icon: React.ElementType
  label: string
  accent?: boolean
  external?: boolean
  onClick?: () => void
}) {
  const className = clsx(
    'flex items-center gap-3 px-4 py-2 text-sm transition-colors',
    accent
      ? 'text-purple-700 hover:bg-purple-50'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  )
  if (external) {
    return (
      <a href={href} className={className} onClick={onClick}>
        <Icon className="h-4 w-4" />
        {label}
      </a>
    )
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}
