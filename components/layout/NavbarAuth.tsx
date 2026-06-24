'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserMenu } from '@/components/layout/UserMenu'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { PlanId } from '@/lib/plans'

interface CurrentUser {
  name: string
  email: string
  avatarUrl: string | null
  plan: PlanId | string | null
}

/**
 * Auth-aware navbar slot for the public/marketing surfaces (landing + pricing).
 * Shows a "Giriş Yap" link when signed out, or the account dropdown when signed in.
 */
export function NavbarAuth() {
  const { t } = useI18n()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const authUser = data.user
      if (!authUser) {
        setLoaded(true)
        return
      }
      const meta = authUser.user_metadata ?? {}
      // Plan lives in profiles; RLS allows users to read their own row.
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', authUser.id)
        .single()
      setUser({
        name: meta.full_name ?? meta.name ?? authUser.email ?? '',
        email: authUser.email ?? '',
        avatarUrl: meta.avatar_url ?? meta.picture ?? null,
        plan: (profile as { plan?: PlanId } | null)?.plan ?? 'free',
      })
      setLoaded(true)
    })
  }, [])

  if (!loaded) return <div className="h-8 w-8" aria-hidden />

  if (!user) {
    return (
      <Link
        href="/login"
        className="text-sm font-medium text-white/70 transition-colors hover:text-white"
      >
        {t.nav.login}
      </Link>
    )
  }

  return (
    <UserMenu
      name={user.name}
      email={user.email}
      avatarUrl={user.avatarUrl}
      plan={user.plan}
      variant="navbar"
    />
  )
}
