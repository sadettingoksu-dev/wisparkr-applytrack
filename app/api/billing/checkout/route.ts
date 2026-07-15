import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'

const bodySchema = z.object({
  plan: z.enum(['pro', 'career_coach']),
  period: z.enum(['monthly', 'yearly']).optional().default('monthly'),
})

/**
 * Ödeme oturumu başlatır.
 *
 * ŞU AN SAĞLAYICI YOK. LemonSqueezy kaldırıldı (merchant-of-record modeli
 * bırakıldı); şirket kurulduktan sonra iyzico/PayTR gelecek.
 *
 * Rota SÖZLEŞMESİ bilinçli olarak korunuyor — `POST {plan, period}` →
 * `{data:{checkout_url}}` — çünkü buna bağlı çağıranlar var:
 *   - components/billing/UpgradeButton.tsx
 *   - app/checkout/page.tsx
 * ve derin linkler: login/signup `?plan=`, lib/supabase/middleware.ts.
 * Yeni sağlayıcı geldiğinde yalnızca bu dosyanın gövdesi dolar; UI değişmez.
 *
 * Plan kilitlemesi bu rotadan BAĞIMSIZ: profiles.plan + trial_ends_at okunuyor
 * (lib/plans.ts, lib/apiAuth.ts), sağlayıcı olmadan da çalışır.
 */
export async function POST(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      error: {
        code: 'BILLING_NOT_CONFIGURED',
        message: 'Ödeme sistemi şu anda kapalı. Çok yakında açılacak.',
      },
    },
    { status: 503 }
  )
}
