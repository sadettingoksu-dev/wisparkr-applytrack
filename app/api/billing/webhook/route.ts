import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlanByVariantId } from '@/lib/plans'

export const runtime = 'nodejs'

const SUBSCRIPTION_EVENTS = new Set([
  'subscription_created',
  'subscription_updated',
  'subscription_cancelled',
  'subscription_expired',
  'subscription_resumed',
])

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  try {
    const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
    const digestBuf = Buffer.from(digest, 'hex')
    const sigBuf = Buffer.from(signature, 'hex')
    // Geçersiz/eksik hex imzalarda timingSafeEqual RangeError fırlatır; uzunluk eşit değilse reddet.
    if (digestBuf.length !== sigBuf.length) return false
    return crypto.timingSafeEqual(digestBuf, sigBuf)
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: { code: 'BILLING_NOT_CONFIGURED', message: 'Webhook secret tanımlı değil.' } },
      { status: 503 }
    )
  }

  const rawBody = await request.text()
  const signature = request.headers.get('x-signature')

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json(
      { error: { code: 'INVALID_SIGNATURE', message: 'Geçersiz webhook imzası.' } },
      { status: 401 }
    )
  }

  const payload = JSON.parse(rawBody)
  const eventName: string = payload.meta?.event_name
  const userId: string | undefined = payload.meta?.custom_data?.user_id

  if (!SUBSCRIPTION_EVENTS.has(eventName) || !userId) {
    return NextResponse.json({ received: true })
  }

  const attrs = payload.data?.attributes ?? {}
  const planConfig = getPlanByVariantId(attrs.variant_id)
  const planId = planConfig?.id ?? 'free'

  const status =
    eventName === 'subscription_cancelled'
      ? 'cancelled'
      : eventName === 'subscription_expired'
        ? 'expired'
        : attrs.status ?? 'active'

  const admin = createAdminClient()

  await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      ls_subscription_id: String(payload.data?.id ?? ''),
      ls_customer_id: attrs.customer_id ? String(attrs.customer_id) : null,
      ls_order_id: attrs.order_id ? String(attrs.order_id) : null,
      plan: planId,
      status,
      renews_at: attrs.renews_at ?? null,
      ends_at: attrs.ends_at ?? null,
    } as never,
    { onConflict: 'ls_subscription_id' }
  )

  const effectivePlan = status === 'active' || status === 'on_trial' ? planId : 'free'
  await admin.from('profiles').update({ plan: effectivePlan } as never).eq('id', userId)

  return NextResponse.json({ received: true })
}
