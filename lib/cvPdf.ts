import PDFDocument from 'pdfkit'
import type { CvData } from '@/lib/cv'
import { CV_TEMPLATE_IDS, normalizeTemplate, type CvTemplate } from '@/lib/cvTemplates'

export { CV_TEMPLATE_IDS, normalizeTemplate }
export type CvPdfTemplate = CvTemplate

interface Theme {
  font: string
  bold: string
  accent: string
  sub: string
  nameSize: number
  rule: boolean
  center: boolean
}

const THEMES: Record<CvPdfTemplate, Theme> = {
  classic: { font: 'Helvetica', bold: 'Helvetica-Bold', accent: '#111827', sub: '#475569', nameSize: 22, rule: true, center: false },
  modern: { font: 'Helvetica', bold: 'Helvetica-Bold', accent: '#7c3aed', sub: '#6d28d9', nameSize: 26, rule: true, center: false },
  minimal: { font: 'Times-Roman', bold: 'Times-Bold', accent: '#000000', sub: '#444444', nameSize: 20, rule: false, center: true },
  elegant: { font: 'Times-Roman', bold: 'Times-Bold', accent: '#6d28d9', sub: '#7c3aed', nameSize: 24, rule: true, center: true },
  professional: { font: 'Helvetica', bold: 'Helvetica-Bold', accent: '#1e3a8a', sub: '#475569', nameSize: 22, rule: true, center: false },
  creative: { font: 'Helvetica', bold: 'Helvetica-Bold', accent: '#c026d3', sub: '#a21caf', nameSize: 28, rule: false, center: false },
}

/**
 * Decodes a base64 data-URL photo to a Buffer PDFKit can embed. Only PNG/JPEG
 * are supported by PDFKit, so other formats (or malformed data) yield null and
 * the CV simply renders without a photo.
 */
function decodePhoto(photo: string): Buffer | null {
  if (!photo) return null
  const m = photo.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i)
  if (!m) return null
  try {
    return Buffer.from(m[2], 'base64')
  } catch {
    return null
  }
}

function sectionHeading(doc: PDFKit.PDFDocument, t: Theme, title: string) {
  doc.moveDown(0.7)
  doc.font(t.bold).fontSize(11).fillColor(t.accent).text(title.toUpperCase())
  if (t.rule) {
    const y = doc.y + 2
    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.width - doc.page.margins.right, y)
      .strokeColor(t.accent)
      .lineWidth(1)
      .stroke()
  }
  doc.moveDown(0.4)
}

function renderCv(doc: PDFKit.PDFDocument, template: CvPdfTemplate, data: CvData) {
  const t = THEMES[template]
  const p = data.personal
  let align: 'left' | 'center' = t.center ? 'center' : 'left'

  // Profesyonel vesikalık fotoğraf: başlığın sağ üst köşesine yerleştirilir.
  // Foto varken metin sola hizalanır ve fotoğrafla çakışmaması için daraltılır.
  const photoBuf = decodePhoto(p.photo)
  const headerTop = doc.y
  let textWidth: number | undefined
  const imgW = 80
  const imgH = 100
  if (photoBuf) {
    const x = doc.page.width - doc.page.margins.right - imgW
    try {
      doc.image(photoBuf, x, headerTop, { fit: [imgW, imgH], align: 'right' })
      align = 'left'
      textWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right - imgW - 18
    } catch {
      // bozuk görsel — fotoğrafsız devam et
    }
  }

  doc.font(t.bold).fontSize(t.nameSize).fillColor(t.accent).text(p.fullName || 'Adınız Soyadınız', { align, width: textWidth })
  if (p.headline) doc.font(t.font).fontSize(12).fillColor(t.sub).text(p.headline, { align, width: textWidth })
  const contact = [p.email, p.phone, p.location, ...p.links.map((l) => l.url || l.label)]
    .filter(Boolean)
    .join('   ·   ')
  if (contact) doc.moveDown(0.2).font(t.font).fontSize(9).fillColor(t.sub).text(contact, { align, width: textWidth })

  // İçerik, fotoğraf metinden uzunsa fotoğrafın altından devam etsin.
  if (photoBuf && doc.y < headerTop + imgH) doc.y = headerTop + imgH

  if (data.summary.trim()) {
    sectionHeading(doc, t, 'Özet')
    doc.font(t.font).fontSize(10).fillColor('#000000').text(data.summary.trim(), { lineGap: 2 })
  }

  if (data.experience.some((e) => e.role || e.company)) {
    sectionHeading(doc, t, 'Deneyim')
    for (const e of data.experience) {
      if (!e.role && !e.company) continue
      doc.font(t.bold).fontSize(11).fillColor('#000000').text([e.role, e.company].filter(Boolean).join(' · '))
      const per = [e.start, e.current ? 'Devam ediyor' : e.end].filter(Boolean).join(' – ')
      const meta = [e.location, per].filter(Boolean).join('   ·   ')
      if (meta) doc.font(t.font).fontSize(9).fillColor(t.sub).text(meta)
      doc.moveDown(0.2)
      for (const b of e.bullets) {
        if (b.trim()) doc.font(t.font).fontSize(10).fillColor('#000000').text(`•  ${b.trim()}`, { indent: 6, lineGap: 1 })
      }
      doc.moveDown(0.3)
    }
  }

  if (data.education.some((e) => e.school || e.degree)) {
    sectionHeading(doc, t, 'Eğitim')
    for (const ed of data.education) {
      if (!ed.school && !ed.degree) continue
      doc.font(t.bold).fontSize(11).fillColor('#000000').text([ed.degree, ed.field].filter(Boolean).join(' - '))
      const per = [ed.start, ed.end].filter(Boolean).join(' – ')
      const meta = [ed.school, per].filter(Boolean).join('   ·   ')
      if (meta) doc.font(t.font).fontSize(9).fillColor(t.sub).text(meta)
      if (ed.note.trim()) doc.font(t.font).fontSize(10).fillColor('#000000').text(ed.note.trim(), { lineGap: 1 })
      doc.moveDown(0.3)
    }
  }

  const skills = data.skills.filter(Boolean)
  if (skills.length) {
    sectionHeading(doc, t, 'Beceriler')
    doc.font(t.font).fontSize(10).fillColor('#000000').text(skills.join('  ·  '), { lineGap: 1 })
  }

  if (data.projects.some((pr) => pr.name)) {
    sectionHeading(doc, t, 'Projeler')
    for (const pr of data.projects) {
      if (!pr.name) continue
      doc.font(t.bold).fontSize(11).fillColor('#000000').text(pr.name)
      if (pr.link) doc.font(t.font).fontSize(9).fillColor(t.sub).text(pr.link)
      if (pr.description.trim()) doc.font(t.font).fontSize(10).fillColor('#000000').text(pr.description.trim(), { lineGap: 1 })
      for (const b of pr.bullets) {
        if (b.trim()) doc.font(t.font).fontSize(10).fillColor('#000000').text(`•  ${b.trim()}`, { indent: 6, lineGap: 1 })
      }
      doc.moveDown(0.3)
    }
  }

  const langs = data.languages.filter((l) => l.name)
  if (langs.length) {
    sectionHeading(doc, t, 'Diller')
    doc
      .font(t.font)
      .fontSize(10)
      .fillColor('#000000')
      .text(langs.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join('  ·  '))
  }

  const certs = data.certifications.filter((c) => c.name)
  if (certs.length) {
    sectionHeading(doc, t, 'Sertifikalar')
    for (const c of certs) {
      doc
        .font(t.font)
        .fontSize(10)
        .fillColor('#000000')
        .text([c.name, c.issuer, c.date].filter(Boolean).join(' · '))
    }
  }
}

/** Renders structured CV data to a PDF buffer. Shared by master + share routes. */
export async function renderCvPdf(data: CvData, template: CvPdfTemplate): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50 })
  const chunks: Buffer[] = []
  doc.on('data', (chunk) => chunks.push(chunk as Buffer))
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })
  renderCv(doc, template, data)
  doc.end()
  return done
}

export function cvPdfFilename(name: string): string {
  return (
    `cv-${name}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'cv'
  )
}
