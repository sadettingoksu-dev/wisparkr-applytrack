import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/lib/types'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Giriş gerekli.' } } satisfies ApiResponse<never>, { status: 401 })

  const { notes } = await req.json()

  const { error } = await supabase
    .from('applications')
    .update({ notes: notes ?? null } as never)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } } satisfies ApiResponse<never>, { status: 500 })

  return NextResponse.json({ data: { ok: true } } satisfies ApiResponse<{ ok: boolean }>)
}
