import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/lib/types'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Giriş gerekli.' } } satisfies ApiResponse<never>, { status: 401 })

  const body = (await req.json().catch(() => null)) as { notes?: unknown } | null
  const rawNotes = body?.notes
  if (rawNotes != null && typeof rawNotes !== 'string') {
    return NextResponse.json({ error: { code: 'INVALID_BODY', message: 'Geçersiz not.' } } satisfies ApiResponse<never>, { status: 400 })
  }
  if (typeof rawNotes === 'string' && rawNotes.length > 10000) {
    return NextResponse.json({ error: { code: 'NOTES_TOO_LONG', message: 'Not çok uzun (en fazla 10.000 karakter).' } } satisfies ApiResponse<never>, { status: 400 })
  }
  const notes = rawNotes ?? null

  const { error } = await supabase
    .from('applications')
    .update({ notes } as never)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } } satisfies ApiResponse<never>, { status: 500 })

  return NextResponse.json({ data: { ok: true } } satisfies ApiResponse<{ ok: boolean }>)
}
