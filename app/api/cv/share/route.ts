import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseCvData, hasCvContent, SHARE_FREE_TTL_DAYS } from '@/lib/cv'
import { normalizeTemplate } from '@/lib/cvPdf'
import { getPlan } from '@/lib/plans'

export const runtime = 'nodejs'

const bodySchema = z.object({
  label: z.string().max(120).optional(),
  template: z.string().optional(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]{3,40}$/, 'Sadece küçük harf, rakam ve tire; 3-40 karakter.')
    .optional(),
})

function appOrigin(request: Request): string {
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}

export async function POST(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId, profile } = ctx

  const cvData = parseCvData(profile.cv_data)
  if (!hasCvContent(cvData)) {
    return NextResponse.json(
      { error: { code: 'NO_CV', message: 'Önce CV oluşturucudan CV\'ni doldurup kaydet.' } },
      { status: 400 }
    )
  }

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json ?? {})
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.errors[0]?.message ?? 'Geçersiz istek.' } },
      { status: 400 }
    )
  }
  const { label, template, slug } = parsed.data
  const isPaid = getPlan(profile.plan).id !== 'free'

  // Custom slug is a Pro perk; otherwise an unguessable random token.
  let token = randomBytes(9).toString('base64url')
  if (slug) {
    if (!isPaid) {
      return NextResponse.json(
        { error: { code: 'FEATURE_NOT_AVAILABLE', message: 'Özel link adı Pro/Career Coach planında mevcut.' } },
        { status: 403 }
      )
    }
    // Uniqueness must be checked globally → admin client (RLS would scope to own rows).
    const admin = createAdminClient()
    const { data: existing } = await admin.from('cv_shares').select('id').eq('token', slug).maybeSingle()
    if (existing) {
      return NextResponse.json(
        { error: { code: 'SLUG_TAKEN', message: 'Bu özel link adı kullanılıyor.' } },
        { status: 409 }
      )
    }
    token = slug
  }

  const expiresAt = isPaid
    ? null
    : new Date(Date.now() + SHARE_FREE_TTL_DAYS * 86400_000).toISOString()

  const { data, error } = await supabase
    .from('cv_shares')
    .insert({
      user_id: userId,
      token,
      label: label ?? null,
      cv_snapshot: cvData,
      template: normalizeTemplate(template),
      expires_at: expiresAt,
    } as never)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error?.message ?? 'Link oluşturulamadı.' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { ...(data as Record<string, unknown>), url: `${appOrigin(request)}/cv/${token}` } })
}

export async function GET(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const { data } = await supabase
    .from('cv_shares')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  const base = appOrigin(request)
  const shares = ((data ?? []) as Record<string, unknown>[]).map((s) => ({ ...s, url: `${base}/cv/${s.token}` }))
  return NextResponse.json({ data: shares })
}
