import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import type { Application } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId, profile } = ctx

  const { data: applicationData, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()
  const application = applicationData as Application | null

  if (error || !application) {
    return NextResponse.json(
      { error: { code: 'APPLICATION_NOT_FOUND', message: 'Başvuru bulunamadı.' } },
      { status: 404 }
    )
  }

  if (!application.tailored_cv_text) {
    return NextResponse.json(
      {
        error: {
          code: 'NO_TAILORED_CV',
          message: 'Bu başvuru için önce CV optimizasyonu yapılmalı.',
        },
      },
      { status: 400 }
    )
  }

  const doc = new PDFDocument({ margin: 50 })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))

  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  doc
    .fontSize(16)
    .text(profile.full_name || profile.email, { align: 'left' })
    .moveDown(0.5)
    .fontSize(11)
    .fillColor('#475569')
    .text(`${application.position_title} - ${application.company_name} için optimize edilmiş CV`)
    .moveDown(1)
    .fillColor('#000000')
    .fontSize(10)
    .text(application.tailored_cv_text, { align: 'left', lineGap: 4 })

  doc.end()
  const pdfBuffer = await done

  const filename = `cv-${application.company_name}-${application.position_title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
    },
  })
}
