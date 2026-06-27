import { lemonSqueezySetup, createCheckout, cancelSubscription as lsCancelSubscription } from '@lemonsqueezy/lemonsqueezy.js'

// LemonSqueezy mutlak bir redirect URL ister; NEXT_PUBLIC_APP_URL boş/eksik
// kalırsa (Vercel'de boş set edilmişti) göreli URL üretmemek için canlı
// domaine düş.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://wisparkr.com'

export function isLemonSqueezyConfigured(): boolean {
  return Boolean(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID)
}

function setup() {
  lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! })
}

/**
 * Creates a Lemon Squeezy checkout session for the given variant and
 * returns the hosted checkout URL. `userId`/`email` are passed as custom
 * data so the webhook can map the resulting subscription back to a profile.
 */
export async function createCheckoutUrl(params: {
  variantId: string
  userId: string
  email: string
}): Promise<string> {
  setup()
  const storeId = Number(process.env.LEMONSQUEEZY_STORE_ID)

  const { data, error } = await createCheckout(storeId, Number(params.variantId), {
    checkoutData: {
      email: params.email,
      custom: { user_id: params.userId },
    },
    productOptions: {
      redirectUrl: `${APP_URL}/settings/billing`,
    },
  })

  if (error || !data) {
    throw new Error(error?.message || 'Lemon Squeezy checkout creation failed')
  }

  return data.data.attributes.url
}

/**
 * Cancels a Lemon Squeezy subscription at the end of the current billing
 * period (the user keeps access until `renews_at`). Returns the new period end.
 */
export async function cancelSubscription(lsSubscriptionId: string): Promise<string | null> {
  setup()
  const { data, error } = await lsCancelSubscription(lsSubscriptionId)
  if (error) {
    throw new Error(error.message || 'Lemon Squeezy cancellation failed')
  }
  return data?.data.attributes.ends_at ?? null
}
