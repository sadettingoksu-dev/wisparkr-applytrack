'use client'

import { useI18n } from '@/components/i18n/I18nProvider'
import { TEMPLATE_VISUALS, type CvTemplate } from '@/lib/cvTemplates'
import type { CvData } from '@/lib/cv'

/**
 * Renders structured CV data as a clean "paper" document that faithfully
 * mirrors the selected PDF template (single / sidebar / band layout + accent).
 * True WYSIWYG: what you see ≈ the downloaded PDF.
 */
export function CvPreview({ data, template = 'classic' }: { data: CvData; template?: CvTemplate }) {
  const { t, locale } = useI18n()
  const { layout, accent, centered, sidebarFilled } = TEMPLATE_VISUALS[template]
  const up = (s: string) => s.toLocaleUpperCase(locale === 'tr' ? 'tr-TR' : 'en-US')

  const p = data.personal
  const contact = [p.email, p.phone, p.location].filter(Boolean)
  const linkVals = p.links.filter((l) => l.url || l.label).map((l) => l.url || l.label)
  const experience = data.experience.filter((e) => e.role || e.company)
  const education = data.education.filter((e) => e.school || e.degree)
  const skills = data.skills.filter(Boolean)
  const projects = data.projects.filter((pr) => pr.name)
  const languages = data.languages.filter((l) => l.name)
  const certifications = data.certifications.filter((c) => c.name)

  const Heading = ({ children }: { children: string }) => (
    <h2 className="mb-2 border-b border-neutral-200 pb-1 text-xs font-bold tracking-wide" style={{ color: accent }}>
      {children}
    </h2>
  )

  const Summary = () =>
    !data.summary.trim() ? null : (
      <section className="mt-5">
        <Heading>{up(t.cvPreview.summary)}</Heading>
        <p className="whitespace-pre-line">{data.summary.trim()}</p>
      </section>
    )

  const Experience = () =>
    experience.length === 0 ? null : (
      <section className="mt-5">
        <Heading>{up(t.cvPreview.experience)}</Heading>
        <div className="space-y-3">
          {experience.map((e, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="font-semibold text-neutral-900">{[e.role, e.company].filter(Boolean).join(' · ')}</p>
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
      </section>
    )

  const Education = () =>
    education.length === 0 ? null : (
      <section className="mt-5">
        <Heading>{up(t.cvPreview.education)}</Heading>
        <div className="space-y-2">
          {education.map((ed, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="font-semibold text-neutral-900">{[ed.degree, ed.field].filter(Boolean).join(' - ')}</p>
                <p className="text-xs font-medium" style={{ color: accent }}>{[ed.start, ed.end].filter(Boolean).join(' – ')}</p>
              </div>
              {ed.school && <p className="text-xs text-neutral-500">{ed.school}</p>}
              {ed.note && <p className="text-neutral-700">{ed.note}</p>}
            </div>
          ))}
        </div>
      </section>
    )

  const Projects = () =>
    projects.length === 0 ? null : (
      <section className="mt-5">
        <Heading>{up(t.cvPreview.projects)}</Heading>
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
      </section>
    )

  const SkillsChips = () =>
    skills.length === 0 ? null : (
      <section className="mt-5">
        <Heading>{up(t.cvPreview.skills)}</Heading>
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s, i) => (
            <span key={i} className="rounded px-2 py-0.5 text-xs" style={{ backgroundColor: `${accent}14`, color: accent }}>{s}</span>
          ))}
        </div>
      </section>
    )

  const Languages = () =>
    languages.length === 0 ? null : (
      <section className="mt-5">
        <Heading>{up(t.cvPreview.languages)}</Heading>
        <p>{languages.map((l) => (l.level ? `${l.name} (${l.level})` : l.name)).join('   ·   ')}</p>
      </section>
    )

  const Certifications = () =>
    certifications.length === 0 ? null : (
      <section className="mt-5">
        <Heading>{up(t.cvPreview.certifications)}</Heading>
        <div className="space-y-1">
          {certifications.map((c, i) => (
            <p key={i}>{[c.name, c.issuer, c.date].filter(Boolean).join(' · ')}</p>
          ))}
        </div>
      </section>
    )

  // ---------- SIDEBAR layout (modern / creative) ----------
  if (layout === 'sidebar') {
    const sideBg = sidebarFilled ? accent : `${accent}12`
    const sideTextColor = sidebarFilled ? 'rgba(255,255,255,0.92)' : '#334155'
    const sideHeadColor = sidebarFilled ? '#ffffff' : accent
    const sideBorder = sidebarFilled ? 'rgba(255,255,255,0.4)' : `${accent}40`
    const SideHeading = ({ children }: { children: string }) => (
      <p className="mb-1.5 mt-1 border-b pb-1 text-[11px] font-bold tracking-wide" style={{ color: sideHeadColor, borderColor: sideBorder }}>{children}</p>
    )
    return (
      <div className="flex overflow-hidden rounded-2xl bg-white text-[13px] leading-relaxed text-neutral-800 shadow-xl">
        <aside className="w-[34%] shrink-0 p-5" style={{ backgroundColor: sideBg }}>
          {p.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photo} alt="" className="mx-auto mb-4 h-20 w-20 rounded-full object-cover" />
          )}
          <div className="mb-4">
            <SideHeading>{up(t.cvPreview.contact)}</SideHeading>
            {contact.map((c, i) => <p key={i} className="mb-0.5 text-[11px] leading-snug" style={{ color: sideTextColor }}>{c}</p>)}
            {linkVals.map((l, i) => <p key={i} className="mb-0.5 text-[11px] leading-snug" style={{ color: sideTextColor }}>{l}</p>)}
          </div>
          {skills.length > 0 && (
            <div className="mb-4">
              <SideHeading>{up(t.cvPreview.skills)}</SideHeading>
              {skills.map((s, i) => <p key={i} className="mb-0.5 text-[11px] leading-snug" style={{ color: sideTextColor }}>• {s}</p>)}
            </div>
          )}
          {languages.length > 0 && (
            <div className="mb-4">
              <SideHeading>{up(t.cvPreview.languages)}</SideHeading>
              {languages.map((l, i) => <p key={i} className="mb-0.5 text-[11px] leading-snug" style={{ color: sideTextColor }}>{l.level ? `${l.name} (${l.level})` : l.name}</p>)}
            </div>
          )}
          {certifications.length > 0 && (
            <div className="mb-4">
              <SideHeading>{up(t.cvPreview.certifications)}</SideHeading>
              {certifications.map((c, i) => <p key={i} className="mb-0.5 text-[11px] leading-snug" style={{ color: sideTextColor }}>{[c.name, c.issuer, c.date].filter(Boolean).join(' · ')}</p>)}
            </div>
          )}
        </aside>
        <div className="min-w-0 flex-1 p-6">
          <h1 className="text-2xl font-bold" style={{ color: accent }}>{p.fullName || t.cvPreview.yourName}</h1>
          {p.headline && <p className="mt-0.5 text-neutral-600">{p.headline}</p>}
          <Summary />
          <Experience />
          <Education />
          <Projects />
        </div>
      </div>
    )
  }

  // ---------- BAND layout (bold) ----------
  if (layout === 'band') {
    return (
      <div className="overflow-hidden rounded-2xl bg-white text-[13px] leading-relaxed text-neutral-800 shadow-xl">
        <header className="flex items-center justify-between gap-4 p-7 text-white" style={{ backgroundColor: accent }}>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">{p.fullName || t.cvPreview.yourName}</h1>
            {p.headline && <p className="mt-0.5 text-white/85">{p.headline}</p>}
            {(contact.length > 0 || linkVals.length > 0) && (
              <p className="mt-2 text-xs text-white/80">{[...contact, ...linkVals].join('   ·   ')}</p>
            )}
          </div>
          {p.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photo} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-white/60" />
          )}
        </header>
        <div className="px-7 pb-7 pt-2">
          <Summary />
          <Experience />
          <Education />
          <SkillsChips />
          <Projects />
          <Languages />
          <Certifications />
        </div>
      </div>
    )
  }

  // ---------- SINGLE layout (classic / professional / minimal / elegant) ----------
  return (
    <div className="rounded-2xl bg-white p-8 text-[13px] leading-relaxed text-neutral-800 shadow-xl">
      <header
        className={`flex gap-4 border-b-2 pb-4 ${centered ? 'flex-col items-center text-center' : 'items-start justify-between'}`}
        style={{ borderColor: accent }}
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-bold" style={{ color: accent }}>{p.fullName || t.cvPreview.yourName}</h1>
          {p.headline && <p className="mt-0.5 text-neutral-600">{p.headline}</p>}
          {(contact.length > 0 || linkVals.length > 0) && (
            <p className="mt-2 text-xs text-neutral-500">{[...contact, ...linkVals].join('   ·   ')}</p>
          )}
        </div>
        {p.photo && !centered && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photo} alt="" className="h-24 w-20 shrink-0 rounded-md object-cover ring-1 ring-neutral-200" />
        )}
      </header>
      <Summary />
      <Experience />
      <Education />
      <SkillsChips />
      <Projects />
      <Languages />
      <Certifications />
    </div>
  )
}
