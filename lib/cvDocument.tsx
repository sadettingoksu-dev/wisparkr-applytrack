import path from 'path'
import React from 'react'
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
  renderToBuffer,
} from '@react-pdf/renderer'
import type { CvData } from './cv'
import { normalizeTemplate, CV_TEMPLATE_IDS, type CvTemplate } from './cvTemplates'

// Rotaların ihtiyaç duyduğu yardımcıları buradan tekrar dışa aktar.
export { normalizeTemplate, CV_TEMPLATE_IDS }
export type CvPdfTemplate = CvTemplate

/** PDF indirme için güvenli dosya adı. */
export function cvPdfFilename(name: string): string {
  return `cv-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'cv'
}

// --- Gömülü Türkçe destekli font (Roboto) -----------------------------------
const FONT_DIR = path.join(process.cwd(), 'assets', 'fonts')
let fontsReady = false
function ensureFonts() {
  if (fontsReady) return
  Font.register({
    family: 'Roboto',
    fonts: [
      { src: path.join(FONT_DIR, 'Roboto-Regular.ttf'), fontWeight: 'normal' },
      { src: path.join(FONT_DIR, 'Roboto-Bold.ttf'), fontWeight: 'bold' },
    ],
  })
  // Türkçe sözcükler satır sonunda kötü kırılmasın.
  Font.registerHyphenationCallback((word) => [word])
  fontsReady = true
}

// Bölüm başlıkları: Türkçe büyük harf (textTransform JS toUpperCase 'i'→'I'
// yaptığı için doğru "İ" elde edilemiyor; bu yüzden elle büyük yazıyoruz).
const H = {
  summary: 'ÖZET',
  experience: 'DENEYİM',
  education: 'EĞİTİM',
  skills: 'BECERİLER',
  projects: 'PROJELER',
  languages: 'DİLLER',
  certifications: 'SERTİFİKALAR',
  contact: 'İLETİŞİM',
}

// --- Şablon teması ----------------------------------------------------------
type Layout = 'single' | 'sidebar'
interface Theme {
  layout: Layout
  accent: string
  headerAlign: 'left' | 'center'
  sidebarFilled: boolean
  nameSize: number
}

const THEMES: Record<CvTemplate, Theme> = {
  classic: { layout: 'single', accent: '#1f2937', headerAlign: 'left', sidebarFilled: false, nameSize: 22 },
  professional: { layout: 'single', accent: '#1e3a8a', headerAlign: 'left', sidebarFilled: false, nameSize: 22 },
  minimal: { layout: 'single', accent: '#111111', headerAlign: 'center', sidebarFilled: false, nameSize: 21 },
  elegant: { layout: 'single', accent: '#6d28d9', headerAlign: 'center', sidebarFilled: false, nameSize: 23 },
  modern: { layout: 'sidebar', accent: '#7c3aed', headerAlign: 'left', sidebarFilled: false, nameSize: 23 },
  creative: { layout: 'sidebar', accent: '#c026d3', headerAlign: 'left', sidebarFilled: true, nameSize: 24 },
}

function period(start: string, end: string, current?: boolean): string {
  const right = current ? 'Devam ediyor' : end
  return [start, right].filter(Boolean).join(' – ')
}

const photoSrc = (photo: string): string | null =>
  /^data:image\/(png|jpe?g);base64,/i.test(photo) ? photo : null

// ---------------------------------------------------------------------------
// SINGLE (tek kolon, ATS-dostu) layout
// ---------------------------------------------------------------------------
function SingleCv({ data, t }: { data: CvData; t: Theme }) {
  const p = data.personal
  const align = t.headerAlign
  const photo = photoSrc(p.photo)
  const contact = [p.email, p.phone, p.location].filter(Boolean)
  const links = p.links.map((l) => l.url || l.label).filter(Boolean)

  const s = StyleSheet.create({
    page: { fontFamily: 'Roboto', fontSize: 10, color: '#1f2937', paddingVertical: 40, paddingHorizontal: 44 },
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    headerText: { flexGrow: 1, flexShrink: 1, alignItems: align === 'center' ? 'center' : 'flex-start' },
    name: { fontSize: t.nameSize, fontWeight: 'bold', color: t.accent, lineHeight: 1.15, marginBottom: 4, textAlign: align },
    headline: { fontSize: 11.5, color: '#475569', textAlign: align },
    contact: { fontSize: 9, color: '#475569', marginTop: 5, textAlign: align },
    photo: { width: 74, height: 90, borderRadius: 4, marginLeft: 16, objectFit: 'cover' },
    rule: { borderBottomWidth: 1.5, borderBottomColor: t.accent, marginTop: 12 },
    section: { marginTop: 15 },
    heading: { fontSize: 10.5, fontWeight: 'bold', color: t.accent, letterSpacing: 1.1, marginBottom: 6, borderBottomWidth: 0.7, borderBottomColor: '#d1d5db', paddingBottom: 3 },
    itemTitle: { fontSize: 11, fontWeight: 'bold', color: '#111827' },
    itemMeta: { fontSize: 9, color: '#64748b', marginTop: 1 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    period: { fontSize: 9, color: t.accent, fontWeight: 'bold' },
    bullet: { flexDirection: 'row', marginTop: 2.5, paddingRight: 8 },
    bulletDot: { width: 10, fontSize: 10, color: t.accent },
    bulletText: { flexGrow: 1, fontSize: 10, color: '#374151', lineHeight: 1.4 },
    body: { fontSize: 10, color: '#374151', lineHeight: 1.4 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 1 },
    chip: { fontSize: 9.5, color: '#374151', backgroundColor: '#f1f5f9', borderRadius: 3, paddingVertical: 2.5, paddingHorizontal: 7, marginRight: 5, marginBottom: 5 },
    item: { marginBottom: 9 },
  })

  const Heading = ({ children }: { children: string }) => <Text style={s.heading}>{children}</Text>

  return (
    <Page size="A4" style={s.page}>
      <View style={s.headerRow}>
        <View style={s.headerText}>
          <Text style={s.name}>{p.fullName || 'Ad Soyad'}</Text>
          {!!p.headline && <Text style={s.headline}>{p.headline}</Text>}
          {(contact.length > 0 || links.length > 0) && (
            <Text style={s.contact}>{[...contact, ...links].join('   •   ')}</Text>
          )}
        </View>
        {photo && align === 'left' && <Image src={photo} style={s.photo} />}
      </View>
      <View style={s.rule} />

      {!!data.summary.trim() && (
        <View style={s.section}>
          <Heading>{H.summary}</Heading>
          <Text style={s.body}>{data.summary.trim()}</Text>
        </View>
      )}

      {data.experience.some((e) => e.role || e.company) && (
        <View style={s.section}>
          <Heading>{H.experience}</Heading>
          {data.experience.map((e, i) =>
            !e.role && !e.company ? null : (
              <View key={i} style={s.item} wrap={false}>
                <View style={s.rowBetween}>
                  <Text style={s.itemTitle}>{[e.role, e.company].filter(Boolean).join(' · ')}</Text>
                  <Text style={s.period}>{period(e.start, e.end, e.current)}</Text>
                </View>
                {!!e.location && <Text style={s.itemMeta}>{e.location}</Text>}
                {e.bullets.filter((b) => b.trim()).map((b, j) => (
                  <View key={j} style={s.bullet}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>{b.trim()}</Text>
                  </View>
                ))}
              </View>
            )
          )}
        </View>
      )}

      {data.education.some((e) => e.school || e.degree) && (
        <View style={s.section}>
          <Heading>{H.education}</Heading>
          {data.education.map((ed, i) =>
            !ed.school && !ed.degree ? null : (
              <View key={i} style={s.item} wrap={false}>
                <View style={s.rowBetween}>
                  <Text style={s.itemTitle}>{[ed.degree, ed.field].filter(Boolean).join(' - ')}</Text>
                  <Text style={s.period}>{period(ed.start, ed.end)}</Text>
                </View>
                {!!ed.school && <Text style={s.itemMeta}>{ed.school}</Text>}
                {!!ed.note.trim() && <Text style={[s.body, { marginTop: 2 }]}>{ed.note.trim()}</Text>}
              </View>
            )
          )}
        </View>
      )}

      {data.skills.filter(Boolean).length > 0 && (
        <View style={s.section}>
          <Heading>{H.skills}</Heading>
          <View style={s.chips}>
            {data.skills.filter(Boolean).map((sk, i) => (
              <Text key={i} style={s.chip}>{sk}</Text>
            ))}
          </View>
        </View>
      )}

      {data.projects.some((pr) => pr.name) && (
        <View style={s.section}>
          <Heading>{H.projects}</Heading>
          {data.projects.map((pr, i) =>
            !pr.name ? null : (
              <View key={i} style={s.item} wrap={false}>
                <Text style={s.itemTitle}>{pr.name}</Text>
                {!!pr.link && <Text style={s.itemMeta}>{pr.link}</Text>}
                {!!pr.description.trim() && <Text style={[s.body, { marginTop: 2 }]}>{pr.description.trim()}</Text>}
                {pr.bullets.filter((b) => b.trim()).map((b, j) => (
                  <View key={j} style={s.bullet}>
                    <Text style={s.bulletDot}>•</Text>
                    <Text style={s.bulletText}>{b.trim()}</Text>
                  </View>
                ))}
              </View>
            )
          )}
        </View>
      )}

      {data.languages.filter((l) => l.name).length > 0 && (
        <View style={s.section}>
          <Heading>{H.languages}</Heading>
          <Text style={s.body}>
            {data.languages.filter((l) => l.name).map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join('   •   ')}
          </Text>
        </View>
      )}

      {data.certifications.filter((c) => c.name).length > 0 && (
        <View style={s.section}>
          <Heading>{H.certifications}</Heading>
          {data.certifications.filter((c) => c.name).map((c, i) => (
            <Text key={i} style={[s.body, { marginBottom: 2 }]}>
              {[c.name, c.issuer, c.date].filter(Boolean).join(' · ')}
            </Text>
          ))}
        </View>
      )}
    </Page>
  )
}

// ---------------------------------------------------------------------------
// SIDEBAR (iki kolon) layout
// ---------------------------------------------------------------------------
function SidebarCv({ data, t }: { data: CvData; t: Theme }) {
  const p = data.personal
  const photo = photoSrc(p.photo)
  const filled = t.sidebarFilled
  const sideBg = filled ? t.accent : '#f4f1fb'
  const sideText = filled ? '#f8fafc' : '#334155'
  const sideHeadingColor = filled ? '#ffffff' : t.accent
  const sideDivider = filled ? 'rgba(255,255,255,0.4)' : '#d8cdf0'
  const links = p.links.map((l) => l.url || l.label).filter(Boolean)

  const s = StyleSheet.create({
    page: { fontFamily: 'Roboto', fontSize: 10, color: '#1f2937' },
    sideBgFixed: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '34%', backgroundColor: sideBg },
    row: { flexDirection: 'row' },
    side: { width: '34%', paddingVertical: 34, paddingHorizontal: 20 },
    main: { width: '66%', paddingVertical: 36, paddingHorizontal: 28 },
    photoWrap: { alignItems: 'center', marginBottom: 18 },
    photo: { width: 96, height: 96, borderRadius: 48, objectFit: 'cover' },
    sideHeading: { fontSize: 10, fontWeight: 'bold', color: sideHeadingColor, letterSpacing: 1, marginBottom: 5, marginTop: 4, borderBottomWidth: 0.7, borderBottomColor: sideDivider, paddingBottom: 3 },
    sideBlock: { marginBottom: 14 },
    sideText: { fontSize: 9.5, color: sideText, marginBottom: 3, lineHeight: 1.35 },
    name: { fontSize: t.nameSize, fontWeight: 'bold', color: t.accent, lineHeight: 1.15, marginBottom: 3 },
    headline: { fontSize: 12, color: '#475569', marginBottom: 4 },
    section: { marginTop: 14 },
    heading: { fontSize: 11, fontWeight: 'bold', color: t.accent, letterSpacing: 0.8, marginBottom: 6, borderBottomWidth: 1.2, borderBottomColor: t.accent, paddingBottom: 3 },
    itemTitle: { fontSize: 11, fontWeight: 'bold', color: '#111827' },
    itemMeta: { fontSize: 9, color: '#64748b', marginTop: 1 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    period: { fontSize: 9, color: t.accent, fontWeight: 'bold' },
    bullet: { flexDirection: 'row', marginTop: 2.5, paddingRight: 6 },
    bulletDot: { width: 10, fontSize: 10, color: t.accent },
    bulletText: { flexGrow: 1, fontSize: 10, color: '#374151', lineHeight: 1.4 },
    body: { fontSize: 10, color: '#374151', lineHeight: 1.4 },
    item: { marginBottom: 9 },
  })

  return (
    <Page size="A4" style={s.page}>
      <View fixed style={s.sideBgFixed} />
      <View style={s.row}>
        <View style={s.side}>
          {photo && (
            <View style={s.photoWrap}>
              <Image src={photo} style={s.photo} />
            </View>
          )}

          <View style={s.sideBlock}>
            <Text style={s.sideHeading}>{H.contact}</Text>
            {!!p.email && <Text style={s.sideText}>{p.email}</Text>}
            {!!p.phone && <Text style={s.sideText}>{p.phone}</Text>}
            {!!p.location && <Text style={s.sideText}>{p.location}</Text>}
            {links.map((l, i) => (
              <Text key={i} style={s.sideText}>{l}</Text>
            ))}
          </View>

          {data.skills.filter(Boolean).length > 0 && (
            <View style={s.sideBlock}>
              <Text style={s.sideHeading}>{H.skills}</Text>
              {data.skills.filter(Boolean).map((sk, i) => (
                <Text key={i} style={s.sideText}>• {sk}</Text>
              ))}
            </View>
          )}

          {data.languages.filter((l) => l.name).length > 0 && (
            <View style={s.sideBlock}>
              <Text style={s.sideHeading}>{H.languages}</Text>
              {data.languages.filter((l) => l.name).map((l, i) => (
                <Text key={i} style={s.sideText}>{l.level ? `${l.name} (${l.level})` : l.name}</Text>
              ))}
            </View>
          )}

          {data.certifications.filter((c) => c.name).length > 0 && (
            <View style={s.sideBlock}>
              <Text style={s.sideHeading}>{H.certifications}</Text>
              {data.certifications.filter((c) => c.name).map((c, i) => (
                <Text key={i} style={s.sideText}>{[c.name, c.issuer, c.date].filter(Boolean).join(' · ')}</Text>
              ))}
            </View>
          )}
        </View>

        <View style={s.main}>
          <Text style={s.name}>{p.fullName || 'Ad Soyad'}</Text>
          {!!p.headline && <Text style={s.headline}>{p.headline}</Text>}

          {!!data.summary.trim() && (
            <View style={s.section}>
              <Text style={s.heading}>{H.summary}</Text>
              <Text style={s.body}>{data.summary.trim()}</Text>
            </View>
          )}

          {data.experience.some((e) => e.role || e.company) && (
            <View style={s.section}>
              <Text style={s.heading}>{H.experience}</Text>
              {data.experience.map((e, i) =>
                !e.role && !e.company ? null : (
                  <View key={i} style={s.item} wrap={false}>
                    <View style={s.rowBetween}>
                      <Text style={s.itemTitle}>{[e.role, e.company].filter(Boolean).join(' · ')}</Text>
                      <Text style={s.period}>{period(e.start, e.end, e.current)}</Text>
                    </View>
                    {!!e.location && <Text style={s.itemMeta}>{e.location}</Text>}
                    {e.bullets.filter((b) => b.trim()).map((b, j) => (
                      <View key={j} style={s.bullet}>
                        <Text style={s.bulletDot}>•</Text>
                        <Text style={s.bulletText}>{b.trim()}</Text>
                      </View>
                    ))}
                  </View>
                )
              )}
            </View>
          )}

          {data.education.some((e) => e.school || e.degree) && (
            <View style={s.section}>
              <Text style={s.heading}>{H.education}</Text>
              {data.education.map((ed, i) =>
                !ed.school && !ed.degree ? null : (
                  <View key={i} style={s.item} wrap={false}>
                    <View style={s.rowBetween}>
                      <Text style={s.itemTitle}>{[ed.degree, ed.field].filter(Boolean).join(' - ')}</Text>
                      <Text style={s.period}>{period(ed.start, ed.end)}</Text>
                    </View>
                    {!!ed.school && <Text style={s.itemMeta}>{ed.school}</Text>}
                    {!!ed.note.trim() && <Text style={[s.body, { marginTop: 2 }]}>{ed.note.trim()}</Text>}
                  </View>
                )
              )}
            </View>
          )}

          {data.projects.some((pr) => pr.name) && (
            <View style={s.section}>
              <Text style={s.heading}>{H.projects}</Text>
              {data.projects.map((pr, i) =>
                !pr.name ? null : (
                  <View key={i} style={s.item} wrap={false}>
                    <Text style={s.itemTitle}>{pr.name}</Text>
                    {!!pr.link && <Text style={s.itemMeta}>{pr.link}</Text>}
                    {!!pr.description.trim() && <Text style={[s.body, { marginTop: 2 }]}>{pr.description.trim()}</Text>}
                    {pr.bullets.filter((b) => b.trim()).map((b, j) => (
                      <View key={j} style={s.bullet}>
                        <Text style={s.bulletDot}>•</Text>
                        <Text style={s.bulletText}>{b.trim()}</Text>
                      </View>
                    ))}
                  </View>
                )
              )}
            </View>
          )}
        </View>
      </View>
    </Page>
  )
}

function CvDocument({ data, template }: { data: CvData; template: CvTemplate }) {
  const t = THEMES[template]
  return (
    <Document author="Wisparkr" title={data.personal.fullName || 'CV'}>
      {t.layout === 'sidebar' ? <SidebarCv data={data} t={t} /> : <SingleCv data={data} t={t} />}
    </Document>
  )
}

/** Renders structured CV data to a PDF buffer (React-PDF engine). */
export async function renderCvPdf(data: CvData, template: string): Promise<Buffer> {
  ensureFonts()
  const el = <CvDocument data={data} template={normalizeTemplate(template)} />
  return renderToBuffer(el)
}
