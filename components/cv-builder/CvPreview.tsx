'use client'

import { useI18n } from '@/components/i18n/I18nProvider'
import type { CvData } from '@/lib/cv'

/**
 * Renders structured CV data as a clean "paper" document, themed to match the
 * selected PDF template (accent color + alignment). Used in the builder's live
 * preview so what you see ≈ the downloaded PDF.
 */
export function CvPreview({
  data,
  accent = '#1f2937',
  centered = false,
}: {
  data: CvData
  accent?: string
  centered?: boolean
}) {
  const { t, locale } = useI18n()
  // Locale-duyarlı büyük harf: TR 'i'→'İ' korunur, EN doğru kalır.
  const up = (s: string) => s.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-US')
  const p = data.personal
  const contact = [p.email, p.phone, p.location].filter(Boolean)
  const links = p.links.filter((l) => l.url || l.label)
  const experience = data.experience.filter((e) => e.role || e.company)
  const education = data.education.filter((e) => e.school || e.degree)
  const skills = data.skills.filter(Boolean)
  const projects = data.projects.filter((pr) => pr.name)
  const languages = data.languages.filter((l) => l.name)
  const certifications = data.certifications.filter((c) => c.name)

  return (
    <div className="rounded-2xl bg-white p-8 text-[13px] leading-relaxed text-neutral-800 shadow-xl">
      {/* Header */}
      <header
        className={`flex gap-4 border-b-2 pb-4 ${centered ? 'flex-col items-center text-center' : 'items-start justify-between'}`}
        style={{ borderColor: accent }}
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: accent }}>
            {p.fullName || t.cvPreview.yourName}
          </h1>
          {p.headline && <p className="mt-0.5 text-neutral-600">{p.headline}</p>}
          {(contact.length > 0 || links.length > 0) && (
            <p className="mt-2 text-xs text-neutral-500">
              {[...contact, ...links.map((l) => l.url || l.label)].join('   ·   ')}
            </p>
          )}
        </div>
        {p.photo && !centered && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.photo}
            alt={p.fullName || t.cvPreview.yourName}
            className="h-24 w-20 shrink-0 rounded-md object-cover ring-1 ring-neutral-200"
          />
        )}
      </header>

      {data.summary.trim() && (
        <Section title={up(t.cvPreview.summary)} accent={accent}>
          <p className="whitespace-pre-line">{data.summary.trim()}</p>
        </Section>
      )}

      {experience.length > 0 && (
        <Section title={up(t.cvPreview.experience)} accent={accent}>
          <div className="space-y-3">
            {experience.map((e, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="font-semibold text-neutral-900">
                    {[e.role, e.company].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-xs font-medium" style={{ color: accent }}>
                    {[e.start, e.current ? t.cvPreview.ongoing : e.end].filter(Boolean).join(' – ')}
                  </p>
                </div>
                {e.location && <p className="text-xs text-neutral-500">{e.location}</p>}
                {e.bullets.filter((b) => b.trim()).length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {e.bullets.filter((b) => b.trim()).map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {education.length > 0 && (
        <Section title={up(t.cvPreview.education)} accent={accent}>
          <div className="space-y-2">
            {education.map((ed, i) => (
              <div key={i}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <p className="font-semibold text-neutral-900">
                    {[ed.degree, ed.field].filter(Boolean).join(' - ')}
                  </p>
                  <p className="text-xs font-medium" style={{ color: accent }}>
                    {[ed.start, ed.end].filter(Boolean).join(' – ')}
                  </p>
                </div>
                {ed.school && <p className="text-xs text-neutral-500">{ed.school}</p>}
                {ed.note && <p className="text-neutral-700">{ed.note}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {skills.length > 0 && (
        <Section title={up(t.cvPreview.skills)} accent={accent}>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <span
                key={i}
                className="rounded px-2 py-0.5 text-xs"
                style={{ backgroundColor: `${accent}14`, color: accent }}
              >
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {projects.length > 0 && (
        <Section title={up(t.cvPreview.projects)} accent={accent}>
          <div className="space-y-2">
            {projects.map((pr, i) => (
              <div key={i}>
                <p className="font-semibold text-neutral-900">{pr.name}</p>
                {pr.link && <p className="text-xs" style={{ color: accent }}>{pr.link}</p>}
                {pr.description && <p className="text-neutral-700">{pr.description}</p>}
                {pr.bullets.filter((b) => b.trim()).length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {pr.bullets.filter((b) => b.trim()).map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {languages.length > 0 && (
        <Section title={up(t.cvPreview.languages)} accent={accent}>
          <p>{languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join('   ·   ')}</p>
        </Section>
      )}

      {certifications.length > 0 && (
        <Section title={up(t.cvPreview.certifications)} accent={accent}>
          <div className="space-y-1">
            {certifications.map((c, i) => (
              <p key={i}>{[c.name, c.issuer, c.date].filter(Boolean).join(' · ')}</p>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2
        className="mb-2 border-b border-neutral-200 pb-1 text-xs font-bold tracking-wide"
        style={{ color: accent }}
      >
        {title}
      </h2>
      {children}
    </section>
  )
}
