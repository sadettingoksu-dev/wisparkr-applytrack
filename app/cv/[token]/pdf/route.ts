import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseCvData, isShareActive } from '@/lib/cv'
import { renderCvPdf, normalizeTemplate, cvPdfFilename } from '@/lib/cvPdf'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const admin = createAdminClient()
  const { data: share } = await admin.from('cv_shares').select('*').eq('token', params.token).maybeSingle()
  if (!share) return new NextResponse('Bulunamadı', { status: 404 })

  const row = share as unknown as {
    user_id: string
    cv_snapshot: unknown
    template: string
    expires_at: string | null
    revoked: boolean
  }

  const { data: owner } = await admin.from('profiles').select('plan').eq('id', row.user_id).maybeSingle()
  const ownerPlan = (owner as { plan?: string } | null)?.plan ?? 'free'

  if (!isShareActive(row, ownerPlan)) {
    return new NextResponse('Bu bağlantının süresi doldu', { status: 410 })
  }

  const data = parseCvData(row.cv_snapshot)
  const pdfBuffer = await renderCvPdf(data, normalizeTemplate(row.template))

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${cvPdfFilename(data.personal.fullName || 'cv')}.pdf"`,
    },
  })
}
