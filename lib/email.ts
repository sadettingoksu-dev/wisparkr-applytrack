import { Resend } from 'resend'

// Gönderen adresi doğrulanmış bir domain olmalı (Resend > Domains).
// EMAIL_FROM tanımlı değilse canlı domaine düş.
const FROM = process.env.EMAIL_FROM || 'Wisparkr <noreply@wisparkr.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.wisparkr.com'

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

/**
 * Sends a single transactional email via Resend. Throws if the provider is not
 * configured or the send fails, so callers can decide how to handle/log it.
 */
export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error('RESEND_API_KEY not configured')
  }
  const resend = new Resend(process.env.RESEND_API_KEY!)
  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
  })
  if (error) {
    throw new Error(error.message || 'Email send failed')
  }
}

function layout(bodyHtml: string): string {
  return `
  <div style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
      <div style="padding:20px 24px;border-bottom:1px solid #f1f5f9">
        <span style="font-size:18px;font-weight:700;color:#7c3aed">Wisparkr</span>
      </div>
      <div style="padding:24px">${bodyHtml}</div>
      <div style="padding:16px 24px;border-top:1px solid #f1f5f9;font-size:12px;color:#94a3b8">
        Bu e-posta abonelik durumunla ilgili otomatik bir bilgilendirmedir.
      </div>
    </div>
  </div>`
}

/**
 * Builds the "your plan renews in ~1 day" reminder email. Sent by the daily
 * cron for active (non-cancelled) subscriptions approaching their renewal date.
 */
export function planRenewalReminderEmail(params: {
  name?: string | null
  planName: string
  price: number
  renewsAt: string
}): { subject: string; html: string } {
  const dateStr = new Date(params.renewsAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const hello = params.name ? `Merhaba ${params.name},` : 'Merhaba,'
  const billingUrl = `${APP_URL}/settings/billing`
  const subject = `${params.planName} planın yarın yenileniyor`
  const html = layout(`
    <p style="margin:0 0 12px;font-size:15px">${hello}</p>
    <p style="margin:0 0 12px;font-size:15px;line-height:1.6">
      <strong>${params.planName}</strong> planın <strong>${dateStr}</strong> tarihinde
      otomatik olarak yenilenecek ve <strong>$${params.price}</strong> tahsil edilecek.
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6">
      Devam etmek istiyorsan yapmana gerek yok — her şey otomatik. Planını
      değiştirmek veya iptal etmek istersen aşağıdan yönetebilirsin.
    </p>
    <a href="${billingUrl}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:10px">
      Planı yönet
    </a>
  `)
  return { subject, html }
}
