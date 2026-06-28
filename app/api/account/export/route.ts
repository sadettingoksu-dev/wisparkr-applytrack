import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'

/**
 * KVKK/GDPR — kullanıcının tüm verisini tek JSON dosyası olarak dışa aktarır.
 * RLS aktif kullanıcı oturumuyla çekildiği için yalnızca kendi satırları döner.
 */
export async function GET() {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId, profile } = ctx

  const [applications, aiMessages, notifications, interviews, shares] = await Promise.all([
    supabase.from('applications').select('*'),
    supabase.from('ai_messages').select('*'),
    supabase.from('notifications').select('*'),
    supabase.from('mock_interviews').select('*'),
    supabase.from('cv_shares').select('*'),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    profile,
    applications: applications.data ?? [],
    ai_messages: aiMessages.data ?? [],
    notifications: notifications.data ?? [],
    mock_interviews: interviews.data ?? [],
    cv_shares: shares.data ?? [],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="wisparkr-verilerim-${userId}.json"`,
    },
  })
}
