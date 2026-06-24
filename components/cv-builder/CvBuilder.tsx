'use client'

import { useState } from 'react'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Download,
  Check,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { TemplatePicker, type CvTemplate } from '@/components/cv/TemplatePicker'
import { CvPreview } from '@/components/cv-builder/CvPreview'
import { useI18n } from '@/components/i18n/I18nProvider'
import type {
  CvData,
  CvExperience,
  CvEducation,
  CvProject,
  CvLanguage,
  CvCertification,
} from '@/lib/cv'

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors'

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const copy = [...arr]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

const emptyExperience: CvExperience = { company: '', role: '', location: '', start: '', end: '', current: false, bullets: [] }
const emptyEducation: CvEducation = { school: '', degree: '', field: '', start: '', end: '', note: '' }
const emptyProject: CvProject = { name: '', description: '', link: '', bullets: [] }
const emptyLanguage: CvLanguage = { name: '', level: '' }
const emptyCertification: CvCertification = { name: '', issuer: '', date: '' }

export function CvBuilder({ initial }: { initial: CvData }) {
  const { t } = useI18n()
  const [cv, setCv] = useState<CvData>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState<CvTemplate>('classic')
  const [skillInput, setSkillInput] = useState('')

  function patch(p: Partial<CvData>) {
    setCv((c) => ({ ...c, ...p }))
    setSaved(false)
  }
  const setPersonal = (p: Partial<CvData['personal']>) => patch({ personal: { ...cv.personal, ...p } })

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/cv/builder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cv),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.newApp.saveError)
        return
      }
      setSaved(true)
    } catch {
      setError(t.common.connectionError)
    } finally {
      setSaving(false)
    }
  }

  function addSkill(raw: string) {
    const value = raw.trim().replace(/,$/, '')
    if (!value || cv.skills.includes(value)) return
    patch({ skills: [...cv.skills, value] })
    setSkillInput('')
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Editor */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.cvBuilder.title}</h1>
          <p className="text-sm text-white/50">
            {t.cvBuilder.subtitle}
          </p>
        </div>

        {/* Kişisel */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-white">{t.cvBuilder.personal}</h2>
          <input className={inputClass} placeholder={t.cvBuilder.fullName} value={cv.personal.fullName} onChange={(e) => setPersonal({ fullName: e.target.value })} />
          <input className={inputClass} placeholder={t.cvBuilder.headline} value={cv.personal.headline} onChange={(e) => setPersonal({ headline: e.target.value })} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input className={inputClass} placeholder={t.cvBuilder.email} value={cv.personal.email} onChange={(e) => setPersonal({ email: e.target.value })} />
            <input className={inputClass} placeholder={t.cvBuilder.phone} value={cv.personal.phone} onChange={(e) => setPersonal({ phone: e.target.value })} />
          </div>
          <input className={inputClass} placeholder={t.cvBuilder.location} value={cv.personal.location} onChange={(e) => setPersonal({ location: e.target.value })} />
          <div className="space-y-2">
            {cv.personal.links.map((link, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputClass} placeholder={t.cvBuilder.linkLabel} value={link.label} onChange={(e) => setPersonal({ links: cv.personal.links.map((l, idx) => (idx === i ? { ...l, label: e.target.value } : l)) })} />
                <input className={inputClass} placeholder="https://..." value={link.url} onChange={(e) => setPersonal({ links: cv.personal.links.map((l, idx) => (idx === i ? { ...l, url: e.target.value } : l)) })} />
                <button onClick={() => setPersonal({ links: cv.personal.links.filter((_, idx) => idx !== i) })} className="shrink-0 rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <AddButton label={t.cvBuilder.addLink} onClick={() => setPersonal({ links: [...cv.personal.links, { label: '', url: '' }] })} />
          </div>
        </Card>

        {/* Özet */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-white">{t.cvBuilder.summary}</h2>
          <textarea className={inputClass} rows={4} placeholder={t.cvBuilder.summaryPlaceholder} value={cv.summary} onChange={(e) => patch({ summary: e.target.value })} />
        </Card>

        {/* Deneyim */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-white">{t.cvBuilder.experience}</h2>
          {cv.experience.map((exp, i) => (
            <ItemFrame key={i} index={i} total={cv.experience.length} onMove={(to) => patch({ experience: moveItem(cv.experience, i, to) })} onRemove={() => patch({ experience: cv.experience.filter((_, idx) => idx !== i) })}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input className={inputClass} placeholder={t.cvBuilder.role} value={exp.role} onChange={(e) => patch({ experience: cv.experience.map((x, idx) => (idx === i ? { ...x, role: e.target.value } : x)) })} />
                <input className={inputClass} placeholder={t.cvBuilder.company} value={exp.company} onChange={(e) => patch({ experience: cv.experience.map((x, idx) => (idx === i ? { ...x, company: e.target.value } : x)) })} />
                <input className={inputClass} placeholder={t.cvBuilder.expLocation} value={exp.location} onChange={(e) => patch({ experience: cv.experience.map((x, idx) => (idx === i ? { ...x, location: e.target.value } : x)) })} />
                <div className="flex gap-2">
                  <input className={inputClass} placeholder={t.cvBuilder.startYear} value={exp.start} onChange={(e) => patch({ experience: cv.experience.map((x, idx) => (idx === i ? { ...x, start: e.target.value } : x)) })} />
                  <input className={inputClass} placeholder={t.cvBuilder.end} value={exp.end} disabled={exp.current} onChange={(e) => patch({ experience: cv.experience.map((x, idx) => (idx === i ? { ...x, end: e.target.value } : x)) })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-white/60">
                <input type="checkbox" checked={exp.current} onChange={(e) => patch({ experience: cv.experience.map((x, idx) => (idx === i ? { ...x, current: e.target.checked } : x)) })} />
                {t.cvBuilder.current}
              </label>
              <textarea className={inputClass} rows={3} placeholder={t.cvBuilder.expBullets} value={exp.bullets.join('\n')} onChange={(e) => patch({ experience: cv.experience.map((x, idx) => (idx === i ? { ...x, bullets: e.target.value.split('\n') } : x)) })} />
            </ItemFrame>
          ))}
          <AddButton label={t.cvBuilder.addExperience} onClick={() => patch({ experience: [...cv.experience, { ...emptyExperience }] })} />
        </Card>

        {/* Eğitim */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-white">{t.cvBuilder.education}</h2>
          {cv.education.map((ed, i) => (
            <ItemFrame key={i} index={i} total={cv.education.length} onMove={(to) => patch({ education: moveItem(cv.education, i, to) })} onRemove={() => patch({ education: cv.education.filter((_, idx) => idx !== i) })}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input className={inputClass} placeholder={t.cvBuilder.degree} value={ed.degree} onChange={(e) => patch({ education: cv.education.map((x, idx) => (idx === i ? { ...x, degree: e.target.value } : x)) })} />
                <input className={inputClass} placeholder={t.cvBuilder.field} value={ed.field} onChange={(e) => patch({ education: cv.education.map((x, idx) => (idx === i ? { ...x, field: e.target.value } : x)) })} />
                <input className={inputClass} placeholder={t.cvBuilder.school} value={ed.school} onChange={(e) => patch({ education: cv.education.map((x, idx) => (idx === i ? { ...x, school: e.target.value } : x)) })} />
                <div className="flex gap-2">
                  <input className={inputClass} placeholder={t.cvBuilder.start} value={ed.start} onChange={(e) => patch({ education: cv.education.map((x, idx) => (idx === i ? { ...x, start: e.target.value } : x)) })} />
                  <input className={inputClass} placeholder={t.cvBuilder.end} value={ed.end} onChange={(e) => patch({ education: cv.education.map((x, idx) => (idx === i ? { ...x, end: e.target.value } : x)) })} />
                </div>
              </div>
              <input className={inputClass} placeholder={t.cvBuilder.eduNote} value={ed.note} onChange={(e) => patch({ education: cv.education.map((x, idx) => (idx === i ? { ...x, note: e.target.value } : x)) })} />
            </ItemFrame>
          ))}
          <AddButton label={t.cvBuilder.addEducation} onClick={() => patch({ education: [...cv.education, { ...emptyEducation }] })} />
        </Card>

        {/* Beceriler */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-white">{t.cvBuilder.skills}</h2>
          <div className="flex flex-wrap gap-1.5">
            {cv.skills.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs text-amber-200">
                {s}
                <button onClick={() => patch({ skills: cv.skills.filter((_, idx) => idx !== i) })} className="hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            className={inputClass}
            placeholder={t.cvBuilder.skillPlaceholder}
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault()
                addSkill(skillInput)
              }
            }}
          />
        </Card>

        {/* Projeler */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-white">{t.cvBuilder.projects}</h2>
          {cv.projects.map((pr, i) => (
            <ItemFrame key={i} index={i} total={cv.projects.length} onMove={(to) => patch({ projects: moveItem(cv.projects, i, to) })} onRemove={() => patch({ projects: cv.projects.filter((_, idx) => idx !== i) })}>
              <input className={inputClass} placeholder={t.cvBuilder.projectName} value={pr.name} onChange={(e) => patch({ projects: cv.projects.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) })} />
              <input className={inputClass} placeholder={t.cvBuilder.projectLink} value={pr.link} onChange={(e) => patch({ projects: cv.projects.map((x, idx) => (idx === i ? { ...x, link: e.target.value } : x)) })} />
              <textarea className={inputClass} rows={2} placeholder={t.cvBuilder.projectDesc} value={pr.description} onChange={(e) => patch({ projects: cv.projects.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)) })} />
              <textarea className={inputClass} rows={2} placeholder={t.cvBuilder.projectBullets} value={pr.bullets.join('\n')} onChange={(e) => patch({ projects: cv.projects.map((x, idx) => (idx === i ? { ...x, bullets: e.target.value.split('\n') } : x)) })} />
            </ItemFrame>
          ))}
          <AddButton label={t.cvBuilder.addProject} onClick={() => patch({ projects: [...cv.projects, { ...emptyProject }] })} />
        </Card>

        {/* Diller & Sertifikalar */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-white">{t.cvBuilder.languages}</h2>
          {cv.languages.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputClass} placeholder={t.cvBuilder.langName} value={l.name} onChange={(e) => patch({ languages: cv.languages.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) })} />
              <input className={inputClass} placeholder={t.cvBuilder.langLevel} value={l.level} onChange={(e) => patch({ languages: cv.languages.map((x, idx) => (idx === i ? { ...x, level: e.target.value } : x)) })} />
              <button onClick={() => patch({ languages: cv.languages.filter((_, idx) => idx !== i) })} className="shrink-0 rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <AddButton label={t.cvBuilder.addLanguage} onClick={() => patch({ languages: [...cv.languages, { ...emptyLanguage }] })} />
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-white">{t.cvBuilder.certifications}</h2>
          {cv.certifications.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputClass} placeholder={t.cvBuilder.certName} value={c.name} onChange={(e) => patch({ certifications: cv.certifications.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) })} />
              <input className={inputClass} placeholder={t.cvBuilder.certIssuer} value={c.issuer} onChange={(e) => patch({ certifications: cv.certifications.map((x, idx) => (idx === i ? { ...x, issuer: e.target.value } : x)) })} />
              <input className={`${inputClass} max-w-[90px]`} placeholder={t.cvBuilder.certYear} value={c.date} onChange={(e) => patch({ certifications: cv.certifications.map((x, idx) => (idx === i ? { ...x, date: e.target.value } : x)) })} />
              <button onClick={() => patch({ certifications: cv.certifications.filter((_, idx) => idx !== i) })} className="shrink-0 rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <AddButton label={t.cvBuilder.addCertification} onClick={() => patch({ certifications: [...cv.certifications, { ...emptyCertification }] })} />
        </Card>
      </div>

      {/* Preview + actions */}
      <div className="lg:sticky lg:top-4 lg:h-fit space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave} disabled={saving} variant="primary">
            {saving ? <Spinner /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {saved ? t.common.saved : t.common.save}
          </Button>
          <a href={`/api/cv/pdf?template=${template}`}>
            <Button variant="secondary">
              <Download className="h-4 w-4" />
              {t.cvBuilder.downloadPdf}
            </Button>
          </a>
          <TemplatePicker value={template} onChange={setTemplate} />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="text-xs text-white/40">{t.cvBuilder.pdfNote}</p>

        <CvPreview data={cv} />
      </div>
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-3 py-2 text-xs font-medium text-white/60 transition-colors hover:border-amber-500/40 hover:text-amber-300">
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

function ItemFrame({
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  index: number
  total: number
  onMove: (to: number) => void
  onRemove: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => onMove(index - 1)} disabled={index === 0} className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-30">
          <ChevronUp className="h-4 w-4" />
        </button>
        <button onClick={() => onMove(index + 1)} disabled={index === total - 1} className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-30">
          <ChevronDown className="h-4 w-4" />
        </button>
        <button onClick={onRemove} className="rounded p-1 text-white/40 hover:bg-white/5 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  )
}
