import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * KVKK/GDPR — hesabı ve tüm bağlı verisini kalıcı siler.
 * Auth kullanıcıyı doğrular, ardından service-role ile auth kullanıcısını siler;
 * profiles ve diğer tablolar FK cascade ile temizlenir.
 */
export async function POST() {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { userId } = ctx

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) {
    return NextResponse.json(
      { error: { code: 'DELETE_FAILED', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { ok: true } })
}
