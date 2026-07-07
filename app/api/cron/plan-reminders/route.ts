import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPlan } from '@/lib/plans'
import { isEmailConfigured, sendEmail, planRenewalReminderEmail } from '@/lib/email'
import type { Profile, Subscription } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Yenileme tarihine bu kadar kala hatırlatma penceresine girilir (~1 gün).
// Cron günde bir çalıştığı için pencereyi 36 saat tutuyoruz ki gün kayması
// olsa bile bir gün atlanmasın.
const WINDOW_HOURS = 36
// Aynı yenileme döngüsünde ikinci kez göndermeyi önlemek için eşik.
const CYCLE_GUARD_MS = 2 * 24 * 60 * 60 * 1000

/**
 * Daily cron: emails users whose active subscription renews within ~1 day.
 * Cancelled/expired subscriptions are skipped (they simply fall back to free).
 * Protected by CRON_SECRET — Vercel Cron sends it as `Authorization: Bearer`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401 })
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({ skipped: 'email_not_configured' })
  }

  const admin = createAdminClient()
  const now = Date.now()
  const nowIso = new Date(now).toISOString()
  const windowEndIso = new Date(now + WINDOW_HOURS * 3600_000).toISOString()

  const { data: subsData, error: subsError } = await admin
    .from('subscriptions')
    .select('id, user_id, plan, status, renews_at, renewal_reminder_sent_at')
    .eq('status', 'active')
    .not('renews_at', 'is', null)
    .gte('renews_at', nowIso)
    .lte('renews_at', windowEndIso)

  if (subsError) {
    return NextResponse.json({ error: { code: 'DB_ERROR', message: subsError.message } }, { status: 500 })
  }

  type SubRow = Pick<Subscription, 'id' | 'user_id' | 'plan' | 'status' | 'renews_at' | 'renewal_reminder_sent_at'>
  const subs = (subsData ?? []) as SubRow[]

  // Bu yenileme döngüsü için henüz hatırlatılmamış olanları seç.
  const due = subs.filter((s) => {
    if (!s.renews_at) return false
    if (!s.renewal_reminder_sent_at) return true
    return new Date(s.renewal_reminder_sent_at).getTime() < new Date(s.renews_at).getTime() - CYCLE_GUARD_MS
  })

  if (due.length === 0) {
    return NextResponse.json({ checked: subs.length, sent: 0 })
  }

  // İlgili profillerin e-posta/isim bilgilerini topluca çek.
  const userIds = [...new Set(due.map((s) => s.user_id))]
  const { data: profilesData } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .in('id', userIds)
  const profiles = (profilesData ?? []) as Pick<Profile, 'id' | 'email' | 'full_name'>[]
  const profileById = new Map(profiles.map((p) => [p.id, p]))

  let sent = 0
  const errors: string[] = []

  for (const sub of due) {
    const profile = profileById.get(sub.user_id)
    if (!profile?.email || !sub.renews_at) continue

    const plan = getPlan(sub.plan)
    const { subject, html } = planRenewalReminderEmail({
      name: profile.full_name,
      planName: plan.name,
      price: plan.priceMonthly,
      renewsAt: sub.renews_at,
    })

    try {
      await sendEmail({ to: profile.email, subject, html })
      await admin
        .from('subscriptions')
        .update({ renewal_reminder_sent_at: new Date().toISOString() } as never)
        .eq('id', sub.id)
      sent++
    } catch (err) {
      errors.push(`${sub.id}: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  return NextResponse.json({ checked: subs.length, due: due.length, sent, errors })
}
