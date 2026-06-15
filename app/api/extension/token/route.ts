import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'

export async function GET() {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { profile } = ctx

  return NextResponse.json({ data: { token: profile.extension_token } })
}

export async function POST() {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const { data, error } = await supabase
    .from('profiles')
    .update({ extension_token: crypto.randomUUID() } as never)
    .eq('id', userId)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error?.message ?? 'Güncelleme başarısız.' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { token: (data as { extension_token: string }).extension_token } })
}
