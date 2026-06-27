import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, ApplicationStatus } from '@/lib/types'

const VALID_STATUSES: ApplicationStatus[] = ['pending', 'interview', 'offer', 'rejected']

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Giriş gerekli.' } } satisfies ApiResponse<never>, { status: 401 })

  const body = (await req.json().catch(() => null)) as { status?: ApplicationStatus } | null
  const status = body?.status
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: { code: 'INVALID_STATUS', message: 'Geçersiz durum.' } } satisfies ApiResponse<never>, { status: 400 })
  }

  const { error } = await supabase
    .from('applications')
    .update({ status } as never)
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: { code: 'DB_ERROR', message: error.message } } satisfies ApiResponse<never>, { status: 500 })

  return NextResponse.json({ data: { ok: true } } satisfies ApiResponse<{ ok: boolean }>)
}
