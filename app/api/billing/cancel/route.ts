import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

/**
 * Kullanıcının aktif aboneliğini iptal eder.
 *
 * Gönüllü iptal ANINDA geçerli olur: profili hemen `free`'ye düşürürüz, böylece
 * arayüz yanıltıcı bir "şu tarihe kadar aktif" sayacı göstermez.
 *
 * NOT: Ödeme sağlayıcısı tarafında faturayı durdurma adımı ŞU AN YOK —
 * LemonSqueezy kaldırıldı, iyzico/PayTR henüz gelmedi. Yeni sağlayıcı
 * geldiğinde iptal çağrısı aşağıya, DB güncellemesinden ÖNCE eklenecek.
 * Bu bir gerileme değil: yerel abonelik kaydı ve plan zaten doğru kapanıyor.
 */
export async function POST() {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { userId } = ctx

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const subscription = sub as { id: string; status: string; renews_at: string | null } | null

  if (!subscription || subscription.status === 'cancelled' || subscription.status === 'expired') {
    return NextResponse.json(
      { error: { code: 'NO_ACTIVE_SUBSCRIPTION', message: 'İptal edilecek aktif bir aboneliğin yok.' } },
      { status: 400 }
    )
  }

  const endsAt = subscription.renews_at

  const { error } = await admin
    .from('subscriptions')
    .update({ status: 'cancelled', ends_at: endsAt } as never)
    .eq('id', subscription.id)

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  // Gönüllü iptal anında etki eder: kullanıcıyı hemen ücretsiz plana düşür.
  await admin.from('profiles').update({ plan: 'free' } as never).eq('id', userId)

  return NextResponse.json({ data: { ends_at: endsAt, plan: 'free' } })
}
