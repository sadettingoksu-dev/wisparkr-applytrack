import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { parseCvData, hasCvContent, isTrialActive } from '@/lib/cv'
import { renderCvPdf, normalizeTemplate, cvPdfFilename } from '@/lib/cvDocument'
import { getPlan } from '@/lib/plans'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { profile } = ctx

  const data = parseCvData(profile.cv_data)
  if (!hasCvContent(data)) {
    return NextResponse.json(
      { error: { code: 'NO_CV', message: 'Önce CV oluşturucudan CV\'ni doldur.' } },
      { status: 400 }
    )
  }

  // inline=1 → CV oluşturucudaki canlı önizleme (iframe içinde). Sadece görüntüleme
  // olduğu için (indirme değil) trial kapısını atlarız; HTML önizleme de kısıtsızdı.
  const inline = new URL(request.url).searchParams.get('inline') === '1'

  // Free: temiz PDF *indirme* yalnızca 7 günlük ücretsiz pencere içinde.
  const plan = getPlan(profile.plan)
  if (!inline && plan.id === 'free' && !isTrialActive(profile.cv_trial_started_at)) {
    return NextResponse.json(
      {
        error: {
          code: 'TRIAL_EXPIRED',
          message: 'Ücretsiz indirme süren doldu. CV\'ni indirmeye devam etmek için Pro\'ya geç.',
        },
      },
      { status: 403 }
    )
  }

  const template = normalizeTemplate(new URL(request.url).searchParams.get('template'))
  const pdfBuffer = await renderCvPdf(data, template)
  const filename = cvPdfFilename(data.personal.fullName || profile.email)

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      // inline → tarayıcıda göster (önizleme); değilse indir.
      'Content-Disposition': inline
        ? `inline; filename="${filename}.pdf"`
        : `attachment; filename="${filename}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
