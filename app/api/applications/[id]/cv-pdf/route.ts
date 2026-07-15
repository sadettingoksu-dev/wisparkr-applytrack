import { NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { trSlug } from '@/lib/cv'
import type { Application } from '@/lib/types'

export const runtime = 'nodejs'

type Template = 'classic' | 'modern' | 'minimal'

const TEMPLATES: Record<
  Template,
  { titleFont: string; bodyFont: string; accent: string; subColor: string; titleSize: number; lineGap: number }
> = {
  classic: { titleFont: 'Helvetica-Bold', bodyFont: 'Helvetica', accent: '#111827', subColor: '#475569', titleSize: 18, lineGap: 4 },
  modern: { titleFont: 'Helvetica-Bold', bodyFont: 'Helvetica', accent: '#d97706', subColor: '#92400e', titleSize: 23, lineGap: 5 },
  minimal: { titleFont: 'Times-Bold', bodyFont: 'Times-Roman', accent: '#000000', subColor: '#444444', titleSize: 16, lineGap: 4 },
}

function renderDocument(
  doc: PDFKit.PDFDocument,
  template: Template,
  opts: { name: string; subtitle: string; body: string }
) {
  const cfg = TEMPLATES[template]
  const align: 'left' | 'center' = template === 'minimal' ? 'center' : 'left'

  doc.font(cfg.titleFont).fontSize(cfg.titleSize).fillColor(cfg.accent).text(opts.name, { align })
  doc.moveDown(0.3)
  doc.font(cfg.bodyFont).fontSize(11).fillColor(cfg.subColor).text(opts.subtitle, { align })
  doc.moveDown(0.6)

  if (template !== 'minimal') {
    const y = doc.y
    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .strokeColor(cfg.accent)
      .lineWidth(template === 'modern' ? 2 : 0.5)
      .stroke()
    doc.moveDown(0.8)
  }

  doc.font(cfg.bodyFont).fontSize(10).fillColor('#000000').text(opts.body, { align: 'left', lineGap: cfg.lineGap })
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId, profile } = ctx

  const { searchParams } = new URL(request.url)
  const templateParam = searchParams.get('template') ?? 'classic'
  const template: Template = (['classic', 'modern', 'minimal'] as const).includes(templateParam as Template)
    ? (templateParam as Template)
    : 'classic'
  const type: 'cv' | 'cover_letter' = searchParams.get('type') === 'cover_letter' ? 'cover_letter' : 'cv'

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

  const content = type === 'cover_letter' ? application.cover_letter_text : application.tailored_cv_text
  if (!content) {
    return NextResponse.json(
      {
        error: {
          code: type === 'cover_letter' ? 'NO_COVER_LETTER' : 'NO_TAILORED_CV',
          message:
            type === 'cover_letter'
              ? 'Bu başvuru için önce bir ön yazı oluşturulmalı.'
              : 'Bu başvuru için önce CV optimizasyonu yapılmalı.',
        },
      },
      { status: 400 }
    )
  }

  const subtitle =
    type === 'cover_letter'
      ? `${application.position_title} · ${application.company_name} — Ön Yazı`
      : `${application.position_title} · ${application.company_name} için optimize edilmiş CV`

  const doc = new PDFDocument({ margin: 50 })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk))
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  renderDocument(doc, template, {
    name: profile.full_name || profile.email,
    subtitle,
    body: content,
  })
  doc.end()
  const pdfBuffer = await done

  // trSlug: şirket/pozisyon adındaki Türkçe harfler doğrudan silinince dosya
  // adı bozuluyordu ("Şişecam" → "i-ecam"). Marka öne alınır — indirilen
  // belgenin nereden geldiği belli olsun.
  const prefix = type === 'cover_letter' ? 'On-Yazi' : 'CV'
  const filename = `Wisparkr-${prefix}-${trSlug(`${application.company_name}-${application.position_title}`)}`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`,
    },
  })
}
