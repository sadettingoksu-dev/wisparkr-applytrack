import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { isLemonSqueezyConfigured, createCheckoutUrl } from '@/lib/lemonsqueezy'
import { getPlan } from '@/lib/plans'

const bodySchema = z.object({
  plan: z.enum(['pro', 'career_coach']),
})

export async function POST(request: Request) {
  if (!isLemonSqueezyConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: 'BILLING_NOT_CONFIGURED',
          message: 'Ödeme sistemi henüz yapılandırılmadı.',
        },
      },
      { status: 503 }
    )
  }

  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { userId, profile } = ctx

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const plan = getPlan(parsed.data.plan)
  if (!plan.lemonSqueezyVariantId) {
    return NextResponse.json(
      {
        error: {
          code: 'BILLING_NOT_CONFIGURED',
          message: `${plan.name} planı için Lemon Squeezy variant ID tanımlı değil.`,
        },
      },
      { status: 503 }
    )
  }

  try {
    const checkoutUrl = await createCheckoutUrl({
      variantId: plan.lemonSqueezyVariantId,
      userId,
      email: profile.email,
    })
    return NextResponse.json({ data: { checkout_url: checkoutUrl } })
  } catch (err) {
    return NextResponse.json(
      { error: { code: 'CHECKOUT_FAILED', message: 'Ödeme oturumu oluşturulamadı.' } },
      { status: 502 }
    )
  }
}
