import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getEffectivePlanId } from '@/lib/plans'
import type { Profile } from '@/lib/types'
import type { PlanId } from '@/lib/plans'

export interface AuthedContext {
  supabase: ReturnType<typeof createClient>
  userId: string
  /** Effective plan applied to `profile.plan` (trial → full access). */
  profile: Profile
  /** The user's *real* plan before trial elevation — use for monetization (link permanence). */
  realPlanId: PlanId
}

/**
 * Resolves the current session + profile for a Route Handler.
 * Returns a NextResponse (401) if there is no authenticated user.
 */
export async function requireAuth(): Promise<AuthedContext | NextResponse> {
  const supabase = createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Oturum bulunamadı.' } },
      { status: 401 }
    )
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json(
      { error: { code: 'PROFILE_NOT_FOUND', message: 'Kullanıcı profili bulunamadı.' } },
      { status: 404 }
    )
  }

  // Gate all downstream features on the *effective* plan so an active 5-day
  // trial grants full access and an expired one falls back to free.
  const realPlanId = ((profile as Profile).plan as PlanId) ?? 'free'
  ;(profile as Profile).plan = getEffectivePlanId(profile as Profile)

  return { supabase, userId: data.user.id, profile: profile as Profile, realPlanId }
}

export function isAuthedContext(ctx: AuthedContext | NextResponse): ctx is AuthedContext {
  return !(ctx instanceof NextResponse)
}

/**
 * Resolves the user from a personal `Authorization: Bearer <extension_token>`
 * header (used by the browser extension, which has no Supabase session).
 * Uses the admin client to bypass RLS for the token lookup.
 */
export async function requireExtensionAuth(request: Request): Promise<AuthedContext | NextResponse> {
  const authHeader = request.headers.get('authorization') ?? ''
  const token = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()

  if (!token) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Eklenti token bulunamadı.' } },
      { status: 401 }
    )
  }

  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from('profiles')
    .select('*')
    .eq('extension_token', token)
    .single()

  if (error || !profile) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Geçersiz eklenti token.' } },
      { status: 401 }
    )
  }

  const realPlanId = ((profile as Profile).plan as PlanId) ?? 'free'
  ;(profile as Profile).plan = getEffectivePlanId(profile as Profile)

  return { supabase: admin as unknown as ReturnType<typeof createClient>, userId: profile.id, profile: profile as Profile, realPlanId }
}
