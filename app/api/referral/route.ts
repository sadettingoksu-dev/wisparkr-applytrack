import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'

function genCode(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()
}

/** Kullanıcının referans kodunu (yoksa üretir) ve davet sayısını döner. */
export async function GET() {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId, profile } = ctx

  let code = profile.referral_code
  if (!code) {
    code = genCode()
    await supabase.from('profiles').update({ referral_code: code } as never).eq('id', userId)
  }

  return NextResponse.json({ data: { code, count: profile.referral_count ?? 0 } })
}
