import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAnthropicClient, classifyInboundEmail } from '@/lib/anthropic'
import type { Application, EmailClassification } from '@/lib/types'

export const runtime = 'nodejs'

const FORWARDING_ADDRESS_RE = /user_([0-9a-fA-F-]{36})@inbox\.wisparkr\.com/

const STATUS_BY_CLASSIFICATION: Partial<Record<EmailClassification, Application['status']>> = {
  interview_invitation: 'interview',
  rejection: 'rejected',
}

const NOTIFICATION_TITLES: Record<EmailClassification, string> = {
  interview_invitation: 'Mülakat daveti aldın',
  rejection: 'Başvurun için yanıt geldi',
  info_request: 'Senden ek bilgi isteniyor',
  other: 'Yeni bir e-posta yönlendirildi',
}

export async function POST(request: Request) {
  const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: { code: 'INBOUND_EMAIL_NOT_CONFIGURED', message: 'Webhook secret tanımlı değil.' } },
      { status: 503 }
    )
  }

  const rawBody = await request.text()

  try {
    const wh = new Webhook(secret)
    wh.verify(rawBody, {
      'svix-id': request.headers.get('svix-id') ?? '',
      'svix-timestamp': request.headers.get('svix-timestamp') ?? '',
      'svix-signature': request.headers.get('svix-signature') ?? '',
    })
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_SIGNATURE', message: 'Geçersiz webhook imzası.' } },
      { status: 401 }
    )
  }

  const payload = JSON.parse(rawBody)
  const data = payload.data ?? payload
  const to: string = data.to?.[0] ?? data.to ?? ''
  const from: string = data.from ?? ''
  const subject: string = data.subject ?? ''
  const body: string = data.text ?? data.html ?? ''

  const match = to.match(FORWARDING_ADDRESS_RE)
  if (!match) {
    return NextResponse.json({ received: true })
  }
  const userId = match[1]

  const admin = createAdminClient()

  const { data: applications } = await admin
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'interview'])

  const apps = (applications ?? []) as Application[]

  const anthropic = getAnthropicClient()
  const result = anthropic
    ? await classifyInboundEmail(
        anthropic,
        { subject, body },
        apps.map((app) => ({
          id: app.id,
          company_name: app.company_name,
          position_title: app.position_title,
          status: app.status,
        }))
      )
    : { classification: 'other' as EmailClassification, application_id: null }

  const matchedApp = apps.find((app) => app.id === result.application_id) ?? null

  await admin.from('inbound_emails').insert({
    user_id: userId,
    application_id: matchedApp?.id ?? null,
    from_address: from,
    subject,
    body,
    classification: result.classification,
  } as never)

  const newStatus = STATUS_BY_CLASSIFICATION[result.classification]
  if (matchedApp && newStatus) {
    await admin.from('applications').update({ status: newStatus } as never).eq('id', matchedApp.id)
  }

  // Kullanıcının bildirim tercihlerini gözet: mülakat daveti → notify_interview,
  // diğer durum değişiklikleri → notify_status_change. Kapalıysa bildirim oluşturma.
  const { data: prefs } = await admin
    .from('profiles')
    .select('notify_interview, notify_status_change')
    .eq('id', userId)
    .single()
  const p = prefs as { notify_interview?: boolean; notify_status_change?: boolean } | null
  const wantsNotif =
    result.classification === 'interview_invitation'
      ? p?.notify_interview ?? true
      : p?.notify_status_change ?? true

  if (wantsNotif) {
    const company = matchedApp?.company_name ?? 'Bir şirket'
    await admin.from('notifications').insert({
      user_id: userId,
      application_id: matchedApp?.id ?? null,
      title: NOTIFICATION_TITLES[result.classification],
      message: `${company}'den gelen "${subject}" konulu mail işlendi.`,
    } as never)
  }

  return NextResponse.json({ received: true })
}
