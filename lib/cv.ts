import { z } from 'zod'

// ---------------------------------------------------------------------------
// Structured CV ("CV Builder") data model.
// Stored in profiles.cv_data (jsonb). Every save also derives a flat,
// ATS-friendly text via flattenCvData() into profiles.cv_text so that all
// existing AI features (fit-score, tailor-cv, cover-letter, skills-gap,
// polish-cv, mock-interview) keep working unchanged.
// ---------------------------------------------------------------------------

export const cvLinkSchema = z.object({
  label: z.string().default(''),
  url: z.string().default(''),
})

export const cvPersonalSchema = z.object({
  fullName: z.string().default(''),
  headline: z.string().default(''),
  email: z.string().default(''),
  phone: z.string().default(''),
  location: z.string().default(''),
  // Profesyonel vesikalık fotoğraf, "data:image/...;base64,..." biçiminde gömülü.
  // Boş string = fotoğraf yok. İstemci tarafında küçültülüp sıkıştırılarak set edilir.
  photo: z.string().default(''),
  links: z.array(cvLinkSchema).default([]),
})

export const cvExperienceSchema = z.object({
  company: z.string().default(''),
  role: z.string().default(''),
  location: z.string().default(''),
  start: z.string().default(''),
  end: z.string().default(''),
  current: z.boolean().default(false),
  bullets: z.array(z.string()).default([]),
})

export const cvEducationSchema = z.object({
  school: z.string().default(''),
  degree: z.string().default(''),
  field: z.string().default(''),
  start: z.string().default(''),
  end: z.string().default(''),
  note: z.string().default(''),
})

export const cvProjectSchema = z.object({
  name: z.string().default(''),
  description: z.string().default(''),
  link: z.string().default(''),
  bullets: z.array(z.string()).default([]),
})

export const cvLanguageSchema = z.object({
  name: z.string().default(''),
  level: z.string().default(''),
})

export const cvCertificationSchema = z.object({
  name: z.string().default(''),
  issuer: z.string().default(''),
  date: z.string().default(''),
})

export const cvDataSchema = z.object({
  personal: cvPersonalSchema.default({}),
  summary: z.string().default(''),
  experience: z.array(cvExperienceSchema).default([]),
  education: z.array(cvEducationSchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(cvProjectSchema).default([]),
  languages: z.array(cvLanguageSchema).default([]),
  certifications: z.array(cvCertificationSchema).default([]),
})

export type CvData = z.infer<typeof cvDataSchema>
export type CvPersonal = z.infer<typeof cvPersonalSchema>
export type CvExperience = z.infer<typeof cvExperienceSchema>
export type CvEducation = z.infer<typeof cvEducationSchema>
export type CvProject = z.infer<typeof cvProjectSchema>
export type CvLanguage = z.infer<typeof cvLanguageSchema>
export type CvCertification = z.infer<typeof cvCertificationSchema>

const CV_TEXT_LIMIT = 15000

/** Builds an empty CV, optionally seeding name/email from the auth profile. */
export function emptyCvData(seed?: { fullName?: string; email?: string }): CvData {
  return cvDataSchema.parse({
    personal: { fullName: seed?.fullName ?? '', email: seed?.email ?? '' },
  })
}

/**
 * Eksiksiz örnek bir CV — CV Builder'da "Örnek ile doldur" için. Yeni
 * başlayanlara her alanın nasıl doldurulacağını gösterir. Türkçe içerikli.
 */
export function sampleCvData(): CvData {
  return cvDataSchema.parse({
    personal: {
      fullName: 'Ayşe Yılmaz',
      headline: 'Frontend Developer',
      email: 'ayse.yilmaz@example.com',
      phone: '+90 555 000 0000',
      location: 'İstanbul, Türkiye',
      links: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/ayseyilmaz' },
        { label: 'GitHub', url: 'https://github.com/ayseyilmaz' },
      ],
    },
    summary:
      '3 yıl deneyimli Frontend Developer. React ve TypeScript ile performanslı, erişilebilir arayüzler geliştiriyorum. Kullanıcı odaklı çözümler ve ölçülebilir etki üretmeye odaklıyım.',
    experience: [
      {
        company: 'TeknoSoft',
        role: 'Frontend Developer',
        location: 'İstanbul',
        start: '2022',
        end: '',
        current: true,
        bullets: [
          'Sayfa yüklenme süresini %40 azaltarak dönüşüm oranını %15 artırdım.',
          'Tasarım sistemini kurarak ekip genelinde geliştirme hızını ikiye katladım.',
          '5 kişilik frontend ekibine mentorluk yaptım.',
        ],
      },
      {
        company: 'StartUpX',
        role: 'Junior Frontend Developer',
        location: 'Uzaktan',
        start: '2021',
        end: '2022',
        current: false,
        bullets: [
          'Müşteri panelini React ile sıfırdan geliştirdim.',
          'Birim test kapsamını %30’dan %80’e çıkardım.',
        ],
      },
    ],
    education: [
      {
        school: 'İstanbul Teknik Üniversitesi',
        degree: 'Lisans',
        field: 'Bilgisayar Mühendisliği',
        start: '2017',
        end: '2021',
        note: 'Onur derecesiyle mezun.',
      },
    ],
    skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Git', 'REST API', 'Jest'],
    projects: [
      {
        name: 'Açık Kaynak Bileşen Kütüphanesi',
        description: 'Erişilebilir React bileşenlerinden oluşan, 500+ yıldız alan kütüphane.',
        link: 'https://github.com/ayseyilmaz/ui-kit',
        bullets: ['Haftalık 2.000+ indirme', 'WCAG 2.1 AA uyumlu'],
      },
    ],
    languages: [
      { name: 'Türkçe', level: 'Ana dil' },
      { name: 'İngilizce', level: 'İleri (C1)' },
    ],
    certifications: [
      { name: 'Meta Front-End Developer', issuer: 'Coursera', date: '2023' },
    ],
  })
}

/** Coerces an unknown jsonb value into a valid CvData (filling defaults). */
export function parseCvData(value: unknown): CvData {
  const result = cvDataSchema.safeParse(value ?? {})
  return result.success ? result.data : emptyCvData()
}

function period(start: string, end: string, current?: boolean): string {
  const right = current ? 'Devam ediyor' : end
  return [start, right].filter(Boolean).join(' - ')
}

/**
 * Flattens structured CV data into ATS-friendly plain text. This is what gets
 * stored in profiles.cv_text and fed to every existing AI feature.
 */
export function flattenCvData(data: CvData): string {
  const lines: string[] = []
  const p = data.personal

  if (p.fullName) lines.push(p.fullName + (p.headline ? ` — ${p.headline}` : ''))
  const contact = [p.email, p.phone, p.location, ...p.links.map((l) => l.url || l.label)]
    .filter(Boolean)
    .join(' | ')
  if (contact) lines.push(contact)

  if (data.summary.trim()) {
    lines.push('', 'ÖZET', data.summary.trim())
  }

  if (data.experience.length) {
    lines.push('', 'DENEYİM')
    for (const e of data.experience) {
      const head = [
        e.role,
        e.company && `${e.role ? ', ' : ''}${e.company}`,
        e.location && ` (${e.location})`,
      ]
        .filter(Boolean)
        .join('')
      const per = period(e.start, e.end, e.current)
      lines.push(per ? `${head} — ${per}` : head)
      for (const b of e.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
    }
  }

  if (data.education.length) {
    lines.push('', 'EĞİTİM')
    for (const ed of data.education) {
      const head = [ed.degree, ed.field && ` - ${ed.field}`, ed.school && `, ${ed.school}`]
        .filter(Boolean)
        .join('')
      const per = period(ed.start, ed.end)
      lines.push(per ? `${head} (${per})` : head)
      if (ed.note.trim()) lines.push(`- ${ed.note.trim()}`)
    }
  }

  if (data.skills.length) {
    lines.push('', 'BECERİLER', data.skills.filter(Boolean).join(', '))
  }

  if (data.projects.length) {
    lines.push('', 'PROJELER')
    for (const pr of data.projects) {
      lines.push(pr.link ? `${pr.name} (${pr.link})` : pr.name)
      if (pr.description.trim()) lines.push(pr.description.trim())
      for (const b of pr.bullets) if (b.trim()) lines.push(`- ${b.trim()}`)
    }
  }

  if (data.languages.length) {
    lines.push(
      '',
      'DİLLER',
      data.languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).filter(Boolean).join(', ')
    )
  }

  if (data.certifications.length) {
    lines.push('', 'SERTİFİKALAR')
    for (const c of data.certifications) {
      lines.push(
        [c.name, c.issuer && ` - ${c.issuer}`, c.date && ` (${c.date})`].filter(Boolean).join('')
      )
    }
  }

  return lines.join('\n').slice(0, CV_TEXT_LIMIT)
}

/** True when the CV has enough content to be usable by AI features. */
export function hasCvContent(data: CvData): boolean {
  return Boolean(
    data.summary.trim() ||
      data.experience.some((e) => e.role || e.company) ||
      data.education.some((e) => e.school || e.degree) ||
      data.skills.length
  )
}

// ---------------------------------------------------------------------------
// Shareable CV link helpers (Faz F monetization).
// ---------------------------------------------------------------------------

export const SHARE_FREE_TTL_DAYS = 5
export const CV_TRIAL_DAYS = 5

export interface ShareActivenessInput {
  expires_at: string | null
  revoked: boolean
}

/**
 * Live activeness check for a shared CV link, evaluated against the owner's
 * CURRENT plan. Free links expire after SHARE_FREE_TTL_DAYS; upgrading to a
 * paid plan instantly re-activates every link (no cron needed).
 */
export function isShareActive(
  share: ShareActivenessInput,
  ownerPlan: string | null | undefined
): boolean {
  if (share.revoked) return false
  if (ownerPlan && ownerPlan !== 'free') return true
  if (!share.expires_at) return false
  return new Date(share.expires_at).getTime() >= Date.now()
}

/** Whether the free 7-day download window (from first CV save) is still open. */
export function isTrialActive(trialStartedAt: string | null | undefined): boolean {
  if (!trialStartedAt) return false
  return Date.now() - new Date(trialStartedAt).getTime() <= CV_TRIAL_DAYS * 86400_000
}
