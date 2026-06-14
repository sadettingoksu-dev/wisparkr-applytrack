import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export interface AuthedContext {
  supabase: ReturnType<typeof createClient>
  userId: string
  profile: Profile
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

  return { supabase, userId: data.user.id, profile }
}

export function isAuthedContext(ctx: AuthedContext | NextResponse): ctx is AuthedContext {
  return !(ctx instanceof NextResponse)
}
