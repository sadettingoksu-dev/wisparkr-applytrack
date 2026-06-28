import { NextResponse } from 'next/server'

/**
 * Hafif, bellek-içi sliding-window rate limiter — pahalı (AI/CV) uçlarda
 * burst/abuse koruması sağlar.
 *
 * NOT: Durum her serverless instance'a özeldir (Vercel yatay ölçeklenir), bu
 * yüzden bu limit kümeler arası KESİN değildir; asıl aylık maliyet tavanı
 * lib/usage.ts içindeki hesap-başı kotadır. Limiti küme genelinde kesinleştirmek
 * için `hit` mantığını Upstash/Redis ile değiştirmek yeterli (imza aynı kalır).
 */

type Timestamp = number
const buckets = new Map<string, Timestamp[]>()

export interface RateLimitOptions {
  limit: number
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/** Pahalı AI/CV uçları için varsayılan: kullanıcı başına dakikada 20 istek. */
export const AI_RATE_LIMIT: RateLimitOptions = { limit: 20, windowSeconds: 60 }

export function rateLimit(key: string, { limit, windowSeconds }: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const cutoff = now - windowMs
  const hits = (buckets.get(key) ?? []).filter((t) => t > cutoff)

  if (hits.length >= limit) {
    buckets.set(key, hits)
    const retryAfterSeconds = Math.max(1, Math.ceil((hits[0] + windowMs - now) / 1000))
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  hits.push(now)
  buckets.set(key, hits)

  // Bellek sınırlaması: harita büyüyünce ölü kovaları temizle.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      const live = v.filter((t) => t > cutoff)
      if (live.length === 0) buckets.delete(k)
      else buckets.set(k, live)
    }
  }

  return { allowed: true, remaining: limit - hits.length, retryAfterSeconds: 0 }
}

/** Limit aşıldığında standart 429 yanıtı (Retry-After başlığıyla). */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: 'RATE_LIMITED',
        message: `Çok fazla istek gönderildi. ${result.retryAfterSeconds} saniye sonra tekrar deneyin.`,
      },
    },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
  )
}
