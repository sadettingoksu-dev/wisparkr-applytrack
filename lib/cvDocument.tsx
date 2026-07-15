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
import { trSlug, type CvData } from './cv'
import {
  normalizeTemplate,
  getTemplate,
  CV_TEMPLATE_IDS,
  DENSITY_SCALE,
  langLevelToScore,
  pseudoSkillScore,
  buildSurfaces,
  type Surf,
  type CvTemplate,
  type CvTemplateDef,
  type CvSectionKey,
} from './cvTemplates'

// Rotaların ihtiyaç duyduğu yardımcıları buradan tekrar dışa aktar.
export { normalizeTemplate, CV_TEMPLATE_IDS }
export type CvPdfTemplate = CvTemplate

/**
 * PDF indirme için dosya adı: `Wisparkr-CV-Ayse-Yilmaz.pdf`.
 * Marka öne alınır (dosya nereden geldiği belli olsun) + adayın adı.
 */
export function cvPdfFilename(name: string): string {
  const slug = trSlug(name)
  if (!slug) return 'Wisparkr-CV'
  // Baş harfleri büyüt: "ayse-yilmaz" → "Ayse-Yilmaz"
  const pretty = slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('-')
  return `Wisparkr-CV-${pretty}`
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
  Font.registerHyphenationCallback((word) => [word])
  fontsReady = true
}

// Bölüm başlıkları: Türkçe büyük harf (elle; toUpperCase 'i'→'I' yapıyor).
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

function period(start: string, end: string, current?: boolean): string {
  const right = current ? 'Devam ediyor' : end
  return [start, right].filter(Boolean).join(' – ')
}

// webp dahil: builder yüklemeyi JPEG'e çeviriyor ama /api/cv/import üzerinden
// gelen webp sessizce düşüyordu.
const photoSrc = (photo: string): string | null =>
  /^data:image\/(png|jpe?g|webp);base64,/i.test(photo) ? photo : null

/** Fotoğraf yokken yer tutucuda gösterilecek baş harfler (en fazla 2). */
function initialsOf(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase('tr-TR'))
    .join('')
}

// ---------------------------------------------------------------------------
// Token → StyleSheet. Tüm layout'lar bunu paylaşır; accent + yoğunluk parametrik.
// ---------------------------------------------------------------------------
function buildStyles(t: CvTemplateDef) {
  const k = DENSITY_SCALE[t.density]
  const accent = t.accent
  const sectionTop = Math.round(15 * k)
  const itemGap = Math.round(9 * k)
  const lh = t.density === 'relaxed' ? 1.5 : t.density === 'compact' ? 1.32 : 1.4

  return StyleSheet.create({
    page: { fontFamily: 'Roboto', fontSize: 10, color: '#1f2937' },
    // İç boşluklar (single/band gövde için)
    pad: { paddingVertical: 40, paddingHorizontal: 44 },

    // Başlık bloğu
    headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    headerText: { flexGrow: 1, flexShrink: 1, alignItems: t.headerAlign === 'center' ? 'center' : 'flex-start' },
    name: { fontSize: t.nameSize, fontWeight: 'bold', color: accent, lineHeight: 1.15, marginBottom: 4, textAlign: t.headerAlign },
    headline: { fontSize: 11.5, color: '#475569', textAlign: t.headerAlign },
    contact: { fontSize: 9, color: '#475569', marginTop: 5, textAlign: t.headerAlign },
    photo: { width: 74, height: 90, borderRadius: 4, marginLeft: 16, objectFit: 'cover' },
    rule: { borderBottomWidth: 1.5, borderBottomColor: accent, marginTop: 12 },

    // Bölüm
    section: { marginTop: sectionTop },
    item: { marginBottom: itemGap },

    // Başlık stilleri (4)
    headingUnderline: { fontSize: 10.5, fontWeight: 'bold', color: accent, letterSpacing: 1.1, marginBottom: 6, borderBottomWidth: 0.7, borderBottomColor: '#d1d5db', paddingBottom: 3 },
    headingPlain: { fontSize: 10.5, fontWeight: 'bold', color: accent, letterSpacing: 2, marginBottom: 6 },
    headingBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    headingBarMark: { width: 3, height: 11, backgroundColor: accent, marginRight: 6 },
    headingBarText: { fontSize: 10.5, fontWeight: 'bold', color: accent, letterSpacing: 1 },
    headingBoxedWrap: { alignSelf: 'flex-start', backgroundColor: accent, borderRadius: 2, paddingVertical: 2.5, paddingHorizontal: 7, marginBottom: 6 },
    headingBoxedText: { fontSize: 9.5, fontWeight: 'bold', color: '#ffffff', letterSpacing: 1 },

    // Madde / içerik
    itemTitle: { fontSize: 11, fontWeight: 'bold', color: '#111827' },
    itemMeta: { fontSize: 9, color: '#64748b', marginTop: 1 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    periodText: { fontSize: 9, color: accent, fontWeight: 'bold' },
    bullet: { flexDirection: 'row', marginTop: 2.5, paddingRight: 8 },
    bulletDot: { width: 10, fontSize: 10, color: accent },
    bulletText: { flexGrow: 1, fontSize: 10, color: '#374151', lineHeight: lh },
    body: { fontSize: 10, color: '#374151', lineHeight: lh },

    // Beceri stilleri
    chips: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 1 },
    chip: { fontSize: 9.5, color: accent, backgroundColor: `${accent}14`, borderRadius: 3, paddingVertical: 2.5, paddingHorizontal: 7, marginRight: 5, marginBottom: 5 },
    skillLine: { flexDirection: 'row', marginTop: 1.5 },
  })
}

type Styles = ReturnType<typeof buildStyles>

// --- Paylaşılan parçalar -----------------------------------------------------
function Heading({ t, s, children }: { t: CvTemplateDef; s: Styles; children: string }) {
  switch (t.headingStyle) {
    case 'plain':
      return <Text style={s.headingPlain}>{children}</Text>
    case 'bar':
      return (
        <View style={s.headingBarRow}>
          <View style={s.headingBarMark} />
          <Text style={s.headingBarText}>{children}</Text>
        </View>
      )
    case 'boxed':
      return (
        <View style={s.headingBoxedWrap}>
          <Text style={s.headingBoxedText}>{children}</Text>
        </View>
      )
    default:
      return <Text style={s.headingUnderline}>{children}</Text>
  }
}

function Bullets({ items, s }: { items: string[]; s: Styles }) {
  return (
    <>
      {items.filter((b) => b.trim()).map((b, j) => (
        <View key={j} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{b.trim()}</Text>
        </View>
      ))}
    </>
  )
}

function Summary({ data, t, s }: { data: CvData; t: CvTemplateDef; s: Styles }) {
  if (!data.summary.trim()) return null
  return (
    <View style={s.section}>
      <Heading t={t} s={s}>{H.summary}</Heading>
      <Text style={s.body}>{data.summary.trim()}</Text>
    </View>
  )
}

function Experience({ data, t, s }: { data: CvData; t: CvTemplateDef; s: Styles }) {
  if (!data.experience.some((e) => e.role || e.company)) return null
  return (
    <View style={s.section}>
      <Heading t={t} s={s}>{H.experience}</Heading>
      {data.experience.map((e, i) =>
        !e.role && !e.company ? null : (
          <View key={i} style={s.item} wrap={false}>
            <View style={s.rowBetween}>
              <Text style={s.itemTitle}>{[e.role, e.company].filter(Boolean).join(' · ')}</Text>
              <Text style={s.periodText}>{period(e.start, e.end, e.current)}</Text>
            </View>
            {!!e.location && <Text style={s.itemMeta}>{e.location}</Text>}
            <Bullets items={e.bullets} s={s} />
          </View>
        )
      )}
    </View>
  )
}

function Education({ data, t, s }: { data: CvData; t: CvTemplateDef; s: Styles }) {
  if (!data.education.some((e) => e.school || e.degree)) return null
  return (
    <View style={s.section}>
      <Heading t={t} s={s}>{H.education}</Heading>
      {data.education.map((ed, i) =>
        !ed.school && !ed.degree ? null : (
          <View key={i} style={s.item} wrap={false}>
            <View style={s.rowBetween}>
              <Text style={s.itemTitle}>{[ed.degree, ed.field].filter(Boolean).join(' - ')}</Text>
              <Text style={s.periodText}>{period(ed.start, ed.end)}</Text>
            </View>
            {!!ed.school && <Text style={s.itemMeta}>{ed.school}</Text>}
            {!!ed.note.trim() && <Text style={[s.body, { marginTop: 2 }]}>{ed.note.trim()}</Text>}
          </View>
        )
      )}
    </View>
  )
}

function Projects({ data, t, s }: { data: CvData; t: CvTemplateDef; s: Styles }) {
  if (!data.projects.some((pr) => pr.name)) return null
  return (
    <View style={s.section}>
      <Heading t={t} s={s}>{H.projects}</Heading>
      {data.projects.map((pr, i) =>
        !pr.name ? null : (
          <View key={i} style={s.item} wrap={false}>
            <Text style={s.itemTitle}>{pr.name}</Text>
            {!!pr.link && <Text style={s.itemMeta}>{pr.link}</Text>}
            {!!pr.description.trim() && <Text style={[s.body, { marginTop: 2 }]}>{pr.description.trim()}</Text>}
            <Bullets items={pr.bullets} s={s} />
          </View>
        )
      )}
    </View>
  )
}

/** Beceri bölümü (single/band gövde): chips | bullets | inline. */
function Skills({ data, t, s }: { data: CvData; t: CvTemplateDef; s: Styles }) {
  const skills = data.skills.filter(Boolean)
  if (skills.length === 0) return null
  return (
    <View style={s.section}>
      <Heading t={t} s={s}>{H.skills}</Heading>
      {t.skillStyle === 'chips' ? (
        <View style={s.chips}>
          {skills.map((sk, i) => <Text key={i} style={s.chip}>{sk}</Text>)}
        </View>
      ) : t.skillStyle === 'bullets' ? (
        <Bullets items={skills} s={s} />
      ) : (
        <Text style={s.body}>{skills.join('   •   ')}</Text>
      )}
    </View>
  )
}

function Languages({ data, t, s }: { data: CvData; t: CvTemplateDef; s: Styles }) {
  const langs = data.languages.filter((l) => l.name)
  if (langs.length === 0) return null
  return (
    <View style={s.section}>
      <Heading t={t} s={s}>{H.languages}</Heading>
      <Text style={s.body}>{langs.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join('   •   ')}</Text>
    </View>
  )
}

function Certifications({ data, t, s }: { data: CvData; t: CvTemplateDef; s: Styles }) {
  const certs = data.certifications.filter((c) => c.name)
  if (certs.length === 0) return null
  return (
    <View style={s.section}>
      <Heading t={t} s={s}>{H.certifications}</Heading>
      {certs.map((c, i) => (
        <Text key={i} style={[s.body, { marginBottom: 2 }]}>{[c.name, c.issuer, c.date].filter(Boolean).join(' · ')}</Text>
      ))}
    </View>
  )
}

function HeaderBlock({ data, t, s, onBand }: { data: CvData; t: CvTemplateDef; s: Styles; onBand?: boolean }) {
  const p = data.personal
  const photo = photoSrc(p.photo)
  const contact = [p.email, p.phone, p.location].filter(Boolean)
  const links = p.links.map((l) => l.url || l.label).filter(Boolean)
  return (
    <View style={s.headerRow}>
      <View style={s.headerText}>
        <Text style={s.name}>{p.fullName || 'Ad Soyad'}</Text>
        {!!p.headline && <Text style={s.headline}>{p.headline}</Text>}
        {(contact.length > 0 || links.length > 0) && (
          <Text style={s.contact}>{[...contact, ...links].join('   •   ')}</Text>
        )}
      </View>
      {photo && (onBand || t.headerAlign === 'left') && <Image src={photo} style={s.photo} />}
    </View>
  )
}

// ---------------------------------------------------------------------------
// SINGLE (tek kolon, ATS-dostu)
// ---------------------------------------------------------------------------
function SingleCv({ data, t, s }: { data: CvData; t: CvTemplateDef; s: Styles }) {
  return (
    <Page size="A4" style={[s.page, s.pad]}>
      <HeaderBlock data={data} t={t} s={s} />
      <View style={s.rule} />
      <Summary data={data} t={t} s={s} />
      <Experience data={data} t={t} s={s} />
      <Education data={data} t={t} s={s} />
      <Skills data={data} t={t} s={s} />
      <Projects data={data} t={t} s={s} />
      <Languages data={data} t={t} s={s} />
      <Certifications data={data} t={t} s={s} />
    </Page>
  )
}

// ---------------------------------------------------------------------------
// SIDEBAR (iki kolon; sol veya sağ)
// ---------------------------------------------------------------------------
function SidebarCv({ data, t, s }: { data: CvData; t: CvTemplateDef; s: Styles }) {
  const p = data.personal
  const photo = photoSrc(p.photo)
  const filled = t.sidebarFilled
  const onRight = t.sidebarSide === 'right'
  const sideBg = filled ? t.accent : `${t.accent}12`
  const sideText = filled ? '#f8fafc' : '#334155'
  const sideHeadingColor = filled ? '#ffffff' : t.accent
  const sideDivider = filled ? 'rgba(255,255,255,0.4)' : `${t.accent}55`
  const links = p.links.map((l) => l.url || l.label).filter(Boolean)
  const skills = data.skills.filter(Boolean)
  const langs = data.languages.filter((l) => l.name)
  const certs = data.certifications.filter((c) => c.name)

  const ss = StyleSheet.create({
    sideBgFixed: { position: 'absolute', top: 0, bottom: 0, width: '34%', backgroundColor: sideBg, ...(onRight ? { right: 0 } : { left: 0 }) },
    row: { flexDirection: 'row' },
    side: { width: '34%', paddingVertical: 34, paddingHorizontal: 20 },
    main: { width: '66%', paddingVertical: 36, paddingHorizontal: 28 },
    photoWrap: { alignItems: 'center', marginBottom: 18 },
    photo: { width: 96, height: 96, borderRadius: 48, objectFit: 'cover' },
    sideHeading: { fontSize: 10, fontWeight: 'bold', color: sideHeadingColor, letterSpacing: 1, marginBottom: 5, marginTop: 4, borderBottomWidth: 0.7, borderBottomColor: sideDivider, paddingBottom: 3 },
    sideBlock: { marginBottom: 14 },
    sideTextRow: { fontSize: 9.5, color: sideText, marginBottom: 3, lineHeight: 1.35 },
    name: { fontSize: t.nameSize, fontWeight: 'bold', color: t.accent, lineHeight: 1.15, marginBottom: 3 },
    headline: { fontSize: 12, color: '#475569', marginBottom: 4 },
  })

  const Side = (
    <View style={ss.side}>
      {photo && (
        <View style={ss.photoWrap}>
          <Image src={photo} style={ss.photo} />
        </View>
      )}
      <View style={ss.sideBlock}>
        <Text style={ss.sideHeading}>{H.contact}</Text>
        {!!p.email && <Text style={ss.sideTextRow}>{p.email}</Text>}
        {!!p.phone && <Text style={ss.sideTextRow}>{p.phone}</Text>}
        {!!p.location && <Text style={ss.sideTextRow}>{p.location}</Text>}
        {links.map((l, i) => <Text key={i} style={ss.sideTextRow}>{l}</Text>)}
      </View>
      {skills.length > 0 && (
        <View style={ss.sideBlock}>
          <Text style={ss.sideHeading}>{H.skills}</Text>
          {skills.map((sk, i) => <Text key={i} style={ss.sideTextRow}>• {sk}</Text>)}
        </View>
      )}
      {langs.length > 0 && (
        <View style={ss.sideBlock}>
          <Text style={ss.sideHeading}>{H.languages}</Text>
          {langs.map((l, i) => <Text key={i} style={ss.sideTextRow}>{l.level ? `${l.name} (${l.level})` : l.name}</Text>)}
        </View>
      )}
      {certs.length > 0 && (
        <View style={ss.sideBlock}>
          <Text style={ss.sideHeading}>{H.certifications}</Text>
          {certs.map((c, i) => <Text key={i} style={ss.sideTextRow}>{[c.name, c.issuer, c.date].filter(Boolean).join(' · ')}</Text>)}
        </View>
      )}
    </View>
  )

  const Main = (
    <View style={ss.main}>
      <Text style={ss.name}>{p.fullName || 'Ad Soyad'}</Text>
      {!!p.headline && <Text style={ss.headline}>{p.headline}</Text>}
      <Summary data={data} t={t} s={s} />
      <Experience data={data} t={t} s={s} />
      <Education data={data} t={t} s={s} />
      <Projects data={data} t={t} s={s} />
    </View>
  )

  return (
    <Page size="A4" style={s.page}>
      <View fixed style={ss.sideBgFixed} />
      <View style={ss.row}>
        {onRight ? (<>{Main}{Side}</>) : (<>{Side}{Main}</>)}
      </View>
    </Page>
  )
}

// ---------------------------------------------------------------------------
// BAND (üstte renkli bant başlık)
// ---------------------------------------------------------------------------
function BandCv({ data, t, s }: { data: CvData; t: CvTemplateDef; s: Styles }) {
  const p = data.personal
  const photo = photoSrc(p.photo)
  const contact = [p.email, p.phone, p.location].filter(Boolean)
  const links = p.links.map((l) => l.url || l.label).filter(Boolean)
  const centered = t.headerAlign === 'center'

  const bs = StyleSheet.create({
    band: { backgroundColor: t.accent, paddingVertical: 28, paddingHorizontal: 44, flexDirection: 'row', alignItems: 'center', justifyContent: centered ? 'center' : 'space-between' },
    bandText: { alignItems: centered ? 'center' : 'flex-start' },
    name: { fontSize: t.nameSize, fontWeight: 'bold', color: '#ffffff', lineHeight: 1.15, textAlign: t.headerAlign },
    headline: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2, textAlign: t.headerAlign },
    contact: { fontSize: 9, color: 'rgba(255,255,255,0.85)', marginTop: 5, textAlign: t.headerAlign },
    photo: { width: 78, height: 78, borderRadius: 39, marginLeft: 16, objectFit: 'cover' },
    body: { paddingVertical: 26, paddingHorizontal: 44 },
  })

  return (
    <Page size="A4" style={s.page}>
      <View style={bs.band}>
        <View style={bs.bandText}>
          <Text style={bs.name}>{p.fullName || 'Ad Soyad'}</Text>
          {!!p.headline && <Text style={bs.headline}>{p.headline}</Text>}
          {(contact.length > 0 || links.length > 0) && (
            <Text style={bs.contact}>{[...contact, ...links].join('   •   ')}</Text>
          )}
        </View>
        {photo && !centered && <Image src={photo} style={bs.photo} />}
      </View>
      <View style={bs.body}>
        <Summary data={data} t={t} s={s} />
        <Experience data={data} t={t} s={s} />
        <Education data={data} t={t} s={s} />
        <Skills data={data} t={t} s={s} />
        <Projects data={data} t={t} s={s} />
        <Languages data={data} t={t} s={s} />
        <Certifications data={data} t={t} s={s} />
      </View>
    </Page>
  )
}

// ===========================================================================
// FOTOĞRAFLI "tam tasarım" şablonlar (category === 'photo')
// Tamamen token-güdümlü, renk-farkında iki kolon. Yıldız → nokta, çubuk → bar
// (Roboto'da ★ glyph'i garanti değil; View tabanlı çizim her zaman render olur).
// ===========================================================================

function PhotoHeading({ t, surf, children }: { t: CvTemplateDef; surf: Surf; children: string }) {
  const base = { fontSize: 10.5, fontWeight: 'bold' as const, color: surf.heading, marginBottom: 6 }
  switch (t.headingStyle) {
    case 'plain':
      return <Text style={{ ...base, letterSpacing: 2 }}>{children}</Text>
    case 'bar':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <View style={{ width: 3, height: 11, backgroundColor: surf.accent, marginRight: 6 }} />
          <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: surf.heading, letterSpacing: 1 }}>{children}</Text>
        </View>
      )
    case 'boxed':
      return (
        <View style={{ alignSelf: 'flex-start', backgroundColor: surf.accent, borderRadius: 2, paddingVertical: 2.5, paddingHorizontal: 8, marginBottom: 6 }}>
          <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: '#ffffff', letterSpacing: 1 }}>{children}</Text>
        </View>
      )
    case 'pill':
      return (
        <View style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: surf.accent, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 12, marginBottom: 7 }}>
          <Text style={{ fontSize: 9.5, fontWeight: 'bold', color: surf.heading, letterSpacing: 1 }}>{children}</Text>
        </View>
      )
    case 'timeline':
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, marginLeft: -14 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: surf.accent, marginRight: 6 }} />
          <Text style={{ fontSize: 10.5, fontWeight: 'bold', color: surf.heading, letterSpacing: 1 }}>{children}</Text>
        </View>
      )
    default: // underline
      return (
        <Text style={{ ...base, letterSpacing: 1.1, borderBottomWidth: 0.8, borderBottomColor: surf.divider, paddingBottom: 3 }}>{children}</Text>
      )
  }
}

/**
 * Yıldız yerine 5 nokta (dolu/boş) — react-pdf'te güvenilir render.
 * flexShrink: 0 ŞART — yoksa uzun bir beceri/dil adı satırı taşırınca Yoga
 * bu bileşeni ezer ve etiket noktaların üstüne biner.
 */
function RatingDots({ score, surf }: { score: number; surf: Surf }) {
  const off = surf.dark ? 'rgba(255,255,255,0.28)' : `${surf.accent}33`
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={{ width: 7, height: 7, borderRadius: 3.5, marginRight: 3, backgroundColor: i < score ? surf.accent : off }} />
      ))}
    </View>
  )
}

/** Seviye çubuğu (track + dolu kısım). flexShrink: 0 — bkz. RatingDots. */
function RatingBar({ score, surf }: { score: number; surf: Surf }) {
  const track = surf.dark ? 'rgba(255,255,255,0.2)' : `${surf.accent}22`
  return (
    <View style={{ width: 78, height: 5, borderRadius: 3, backgroundColor: track, overflow: 'hidden', flexShrink: 0 }}>
      <View style={{ width: `${(score / 5) * 100}%`, height: '100%', backgroundColor: surf.accent, borderRadius: 3 }} />
    </View>
  )
}

function PhotoBullets({ items, surf }: { items: string[]; surf: Surf }) {
  return (
    <>
      {items.filter((b) => b.trim()).map((b, j) => (
        <View key={j} style={{ flexDirection: 'row', marginTop: 2.5, paddingRight: 6 }}>
          <Text style={{ width: 9, fontSize: 9.5, color: surf.accent }}>•</Text>
          <Text style={{ flexGrow: 1, flexShrink: 1, fontSize: 9.5, color: surf.text, lineHeight: 1.38 }}>{b.trim()}</Text>
        </View>
      ))}
    </>
  )
}

/** Bir bölümü (key) verilen yüzeyde çizer. */
function PhotoSection({
  sectionKey, data, t, surf,
}: { sectionKey: CvSectionKey; data: CvData; t: CvTemplateDef; surf: Surf }) {
  const p = data.personal
  // density token'ı bağlı: eskiden sabit 13'tü ve t.density tamamen yok
  // sayılıyordu (zarifyesil'in 'relaxed'ı hiçbir işe yaramıyordu).
  const d = DENSITY_SCALE[t.density] ?? 1
  const gap = (n: number) => Math.round(n * d * 10) / 10
  const wrap = { marginBottom: gap(13) }
  const label = {
    summary: H.summary, experience: H.experience, education: H.education,
    skills: H.skills, languages: H.languages, certifications: H.certifications,
    projects: H.projects, contact: H.contact,
  }[sectionKey]
  const Head = () => <PhotoHeading t={t} surf={surf}>{label}</PhotoHeading>
  const meta = { fontSize: 9, color: surf.meta, marginTop: 1 }
  const title = { fontSize: 10.5, fontWeight: 'bold' as const, color: surf.title }
  const body = { fontSize: 9.5, color: surf.text, lineHeight: 1.4 }
  const periodStyle = { fontSize: 8.5, color: surf.accent, fontWeight: 'bold' as const, flexShrink: 0, marginLeft: 8 }
  /**
   * Puanlı satırlarda (beceri/dil) sol etiket.
   * flexBasis: 0 KRİTİK: yalnızca flexShrink:1 varken uzun bir ad satırı
   * taşırıyor ve yanındaki puan bileşeninin üstüne biniyordu. Deneyim/eğitim
   * satırları (aşağıda) bunu zaten doğru yapıyor — aynı desen.
   * Sidebar dar (A4'ün ~%36'sı eksi padding ≈ 190pt); puanlar ~50pt aldığı için
   * ada ~130pt kalıyor. Font hyphenation kapalı (Font.registerHyphenationCallback)
   * → uzun kelime bölünmez, o yüzden taşmayı flex ile durdurmak zorundayız.
   */
  const ratingLabel = { fontSize: 9.5, color: surf.text, flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingRight: 8 }

  if (sectionKey === 'contact') {
    const lines = [p.email, p.phone, p.location, ...p.links.map((l) => l.url || l.label).filter(Boolean)].filter(Boolean)
    if (lines.length === 0) return null
    return (
      <View style={wrap}>
        <Head />
        {lines.map((l, i) => <Text key={i} style={{ fontSize: 9, color: surf.text, marginBottom: 3, lineHeight: 1.35 }}>{l}</Text>)}
      </View>
    )
  }

  if (sectionKey === 'summary') {
    if (!data.summary.trim()) return null
    return <View style={wrap}><Head /><Text style={body}>{data.summary.trim()}</Text></View>
  }

  if (sectionKey === 'experience') {
    const items = data.experience.filter((e) => e.role || e.company)
    if (items.length === 0) return null
    return (
      <View style={wrap}>
        <Head />
        {items.map((e, i) => (
          <View key={i} style={{ marginBottom: gap(8) }} wrap={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ ...title, flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>{[e.role, e.company].filter(Boolean).join(' · ')}</Text>
              <Text style={periodStyle}>{period(e.start, e.end, e.current)}</Text>
            </View>
            {!!e.location && <Text style={meta}>{e.location}</Text>}
            <PhotoBullets items={e.bullets} surf={surf} />
          </View>
        ))}
      </View>
    )
  }

  if (sectionKey === 'education') {
    const items = data.education.filter((e) => e.school || e.degree)
    if (items.length === 0) return null
    return (
      <View style={wrap}>
        <Head />
        {items.map((ed, i) => (
          <View key={i} style={{ marginBottom: gap(7) }} wrap={false}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={{ ...title, flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>{[ed.degree, ed.field].filter(Boolean).join(' - ') || ed.school}</Text>
              <Text style={periodStyle}>{period(ed.start, ed.end)}</Text>
            </View>
            {!!(ed.degree || ed.field) && !!ed.school && <Text style={meta}>{ed.school}</Text>}
            {!!ed.note.trim() && <Text style={{ ...body, marginTop: 2 }}>{ed.note.trim()}</Text>}
          </View>
        ))}
      </View>
    )
  }

  if (sectionKey === 'certifications') {
    const items = data.certifications.filter((c) => c.name)
    if (items.length === 0) return null
    return (
      <View style={wrap}>
        <Head />
        {items.map((c, i) => <Text key={i} style={{ ...body, marginBottom: gap(2.5) }}>{[c.name, c.issuer, c.date].filter(Boolean).join(' · ')}</Text>)}
      </View>
    )
  }

  if (sectionKey === 'projects') {
    const items = data.projects.filter((pr) => pr.name)
    if (items.length === 0) return null
    return (
      <View style={wrap}>
        <Head />
        {items.map((pr, i) => (
          <View key={i} style={{ marginBottom: gap(7) }} wrap={false}>
            <Text style={title}>{pr.name}</Text>
            {!!pr.link && <Text style={meta}>{pr.link}</Text>}
            {!!pr.description.trim() && <Text style={{ ...body, marginTop: 2 }}>{pr.description.trim()}</Text>}
            <PhotoBullets items={pr.bullets} surf={surf} />
          </View>
        ))}
      </View>
    )
  }

  if (sectionKey === 'languages') {
    const items = data.languages.filter((l) => l.name)
    if (items.length === 0) return null
    const style = t.langStyle ?? 'text'
    return (
      <View style={wrap}>
        <Head />
        {style === 'text' ? (
          items.map((l, i) => <Text key={i} style={{ ...body, marginBottom: gap(2) }}>{l.level ? `${l.name} (${l.level})` : l.name}</Text>)
        ) : (
          items.map((l, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: gap(4) }}>
              <Text style={ratingLabel}>{l.name}</Text>
              {style === 'stars' ? <RatingDots score={langLevelToScore(l.level)} surf={surf} /> : <RatingBar score={langLevelToScore(l.level)} surf={surf} />}
            </View>
          ))
        )}
      </View>
    )
  }

  // skills
  const items = data.skills.filter(Boolean)
  if (items.length === 0) return null
  const style = t.skillStyle
  return (
    <View style={wrap}>
      <Head />
      {style === 'chips' ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {items.map((sk, i) => <Text key={i} style={{ fontSize: 9, color: surf.accent, backgroundColor: `${surf.accent}1e`, borderRadius: 3, paddingVertical: 2.5, paddingHorizontal: 7, marginRight: 5, marginBottom: 5 }}>{sk}</Text>)}
        </View>
      ) : style === 'inline' ? (
        <Text style={body}>{items.join('   ·   ')}</Text>
      ) : style === 'stars' ? (
        items.map((sk, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: gap(4) }}>
            <Text style={ratingLabel}>{sk}</Text>
            <RatingDots score={pseudoSkillScore(i)} surf={surf} />
          </View>
        ))
      ) : style === 'bars' ? (
        items.map((sk, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: gap(4) }}>
            <Text style={ratingLabel}>{sk}</Text>
            <RatingBar score={pseudoSkillScore(i)} surf={surf} />
          </View>
        ))
      ) : (
        <PhotoBullets items={items} surf={surf} />
      )}
    </View>
  )
}

/**
 * Fotoğraf çerçevesi — fotoğraf YOKKEN de aynı yeri kaplar.
 *
 * Eskiden `{photo && <PhotoFrame/>}` idi: fotoğrafsız kullanıcıda çerçeve
 * tamamen yok oluyor, sidebar'daki her bölüm ~130-146pt yukarı kayıyor, ana
 * kolon yerinde kaldığı için iki kolonun hizası bozuluyordu (nameIn:'sidebar'
 * şablonlarda isim sayfanın tepesine zıplıyordu). Artık her zaman render
 * edilir; fotoğraf yoksa baş harf rozeti gösterilir — boş boşluk hata gibi
 * görünürdü, rozet kasıtlı durur ve her bilginin kağıttaki yeri sabit kalır.
 */
function PhotoFrame({ src, t, surf, initials }: { src: string | null; t: CvTemplateDef; surf: Surf; initials: string }) {
  const shape = t.photoShape ?? 'circle'
  const border = t.photoBorder ? { borderWidth: 3, borderColor: t.photoBorder } : {}
  const placeholder = {
    backgroundColor: surf.dark ? 'rgba(255,255,255,0.10)' : `${surf.accent}1e`,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }
  const fill = { width: '100%' as const, height: '100%' as const, objectFit: 'cover' as const }

  if (shape === 'circle') {
    return (
      <View style={{ alignItems: 'center', marginBottom: 14 }}>
        <View style={{ width: 92, height: 92, borderRadius: 46, overflow: 'hidden', ...border, ...(src ? {} : placeholder) }}>
          {src ? (
            <Image src={src} style={fill} />
          ) : (
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: surf.accent }}>{initials}</Text>
          )}
        </View>
      </View>
    )
  }
  const radius = shape === 'rounded' ? 10 : 3
  return (
    <View style={{ width: '100%', height: 132, borderRadius: radius, overflow: 'hidden', marginBottom: 14, ...border, ...(src ? {} : placeholder) }}>
      {src ? (
        <Image src={src} style={fill} />
      ) : (
        <Text style={{ fontSize: 34, fontWeight: 'bold', color: surf.accent }}>{initials}</Text>
      )}
    </View>
  )
}

function NameBlock({ data, t, surf, onBand }: { data: CvData; t: CvTemplateDef; surf: Surf; onBand?: boolean }) {
  const p = data.personal
  const nameColor = onBand ? '#ffffff' : (t.nameColor ?? (surf.dark ? '#ffffff' : t.accent))
  const headlineColor = onBand ? (t.headlineColor ?? 'rgba(255,255,255,0.9)') : (t.headlineColor ?? surf.accent)
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: t.nameSize, fontWeight: 'bold', color: nameColor, lineHeight: 1.12 }}>{p.fullName || 'Ad Soyad'}</Text>
      {!!p.headline && <Text style={{ fontSize: 12, color: headlineColor, marginTop: 3, fontWeight: 'bold' }}>{p.headline}</Text>}
    </View>
  )
}

function PhotoCv({ data, t }: { data: CvData; t: CvTemplateDef }) {
  const p = data.personal
  const photo = photoSrc(p.photo)
  const { side, main } = buildSurfaces(t)
  const sideW = t.sideWidth ?? 0.34
  const onRight = t.sidebarSide === 'right'
  const sidePct = `${Math.round(sideW * 100)}%`
  const mainPct = `${Math.round((1 - sideW) * 100)}%`
  const nameIn = t.nameIn ?? 'main'
  const sideSecs = t.sidebarSections ?? ['contact', 'skills', 'languages', 'certifications']
  const mainSecs = t.mainSections ?? ['summary', 'experience', 'education', 'projects']

  const SideCol = (
    <View style={{ width: sidePct, paddingVertical: 30, paddingHorizontal: 18 }}>
      {/* Koşulsuz: fotoğraf yoksa da aynı yeri kaplar → kolonların hizası sabit. */}
      <PhotoFrame src={photo} t={t} surf={side} initials={initialsOf(p.fullName)} />
      {nameIn === 'sidebar' && <NameBlock data={data} t={t} surf={side} />}
      {sideSecs.map((k) => <PhotoSection key={k} sectionKey={k} data={data} t={t} surf={side} />)}
    </View>
  )

  const timeline = t.headingStyle === 'timeline'
  const MainInner = (
    <View style={timeline ? { paddingLeft: 14, borderLeftWidth: 1.2, borderLeftColor: `${main.accent}44` } : {}}>
      {nameIn === 'main' && <NameBlock data={data} t={t} surf={main} />}
      {mainSecs.map((k) => <PhotoSection key={k} sectionKey={k} data={data} t={t} surf={main} />)}
    </View>
  )

  const MainCol =
    nameIn === 'band' ? (
      <View style={{ width: mainPct }}>
        <View style={{ backgroundColor: t.accent, paddingVertical: 22, paddingHorizontal: 26 }}>
          <NameBlock data={data} t={t} surf={main} onBand />
        </View>
        <View style={{ paddingVertical: 22, paddingHorizontal: 26 }}>{MainInner}</View>
      </View>
    ) : (
      <View style={{ width: mainPct, paddingVertical: 30, paddingHorizontal: 26 }}>{MainInner}</View>
    )

  return (
    <Page size="A4" style={{ fontFamily: 'Roboto', fontSize: 10 }}>
      {/* Tam yükseklik kolon arka planları (kısa içerikte de zemin dolu kalsın). */}
      <View fixed style={{ position: 'absolute', top: 0, bottom: 0, width: sidePct, backgroundColor: side.bg, ...(onRight ? { right: 0 } : { left: 0 }) }} />
      <View fixed style={{ position: 'absolute', top: 0, bottom: 0, width: mainPct, backgroundColor: main.bg, ...(onRight ? { left: 0 } : { right: 0 }) }} />
      <View style={{ flexDirection: 'row' }}>
        {onRight ? (<>{MainCol}{SideCol}</>) : (<>{SideCol}{MainCol}</>)}
      </View>
    </Page>
  )
}

function CvDocument({ data, template }: { data: CvData; template: CvTemplate }) {
  const t = getTemplate(template)
  const s = buildStyles(t)
  return (
    <Document author="Wisparkr" title={data.personal.fullName || 'CV'}>
      {t.category === 'photo' ? (
        <PhotoCv data={data} t={t} />
      ) : t.layout === 'sidebar' ? (
        <SidebarCv data={data} t={t} s={s} />
      ) : t.layout === 'band' ? (
        <BandCv data={data} t={t} s={s} />
      ) : (
        <SingleCv data={data} t={t} s={s} />
      )}
    </Document>
  )
}

/** Renders structured CV data to a PDF buffer (React-PDF engine). */
export async function renderCvPdf(data: CvData, template: string): Promise<Buffer> {
  ensureFonts()
  const el = <CvDocument data={data} template={normalizeTemplate(template)} />
  return renderToBuffer(el)
}
