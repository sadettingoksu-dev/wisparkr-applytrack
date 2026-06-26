'use client'

import { useRef, useState } from 'react'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Download,
  Check,
  X,
  Sparkles,
  ImageIcon,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { TemplatePicker, type CvTemplate } from '@/components/cv/TemplatePicker'
import { CvPreview } from '@/components/cv-builder/CvPreview'
import { useI18n } from '@/components/i18n/I18nProvider'
import { hasCvContent } from '@/lib/cv'
import type {
  CvData,
  CvExperience,
  CvEducation,
  CvProject,
  CvLanguage,
  CvCertification,
} from '@/lib/cv'
import type { CvReviewResult } from '@/lib/anthropic'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-colors'

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const copy = [...arr]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

/**
 * Reads an image file, downscales it to a passport-sized square-ish thumbnail
 * and re-encodes it as a compact JPEG data URL so it can live inside cv_data
 * (jsonb) without bloating it. Runs entirely in the browser.
 */
async function fileToCompressedDataUrl(file: File, maxDim = 400, quality = 0.85): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = () => reject(new Error('decode failed'))
    im.src = dataUrl
  })
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', quality)
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

  async function handleSave(): Promise<boolean> {
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
        return false
      }
      setSaved(true)
      return true
    } catch {
      setError(t.common.connectionError)
      return false
    } finally {
      setSaving(false)
    }
  }

  // Mevcut CV dosyasını içe aktar: AI ile yapılandırılıp builder alanlarına dolar.
  const importFileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  async function handleImportFile(file: File | null) {
    if (!file) return
    setImportError(null)
    // Builder'da içerik varsa üzerine yazmadan önce onay al.
    if (hasCvContent(cv) && !window.confirm(t.cvBuilder.importConfirm)) {
      if (importFileRef.current) importFileRef.current.value = ''
      return
    }
    setImporting(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/cv/import', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setImportError(json.error?.message ?? t.common.error)
        return
      }
      const parsed = json.data as CvData
      // Kullanıcı zaten fotoğraf eklediyse koru.
      setCv({ ...parsed, personal: { ...parsed.personal, photo: cv.personal.photo || parsed.personal.photo } })
      setSaved(false)
    } catch {
      setImportError(t.common.connectionError)
    } finally {
      setImporting(false)
      if (importFileRef.current) importFileRef.current.value = ''
    }
  }

  // Profesyonel fotoğraf yükleme: istemcide küçültülüp cv_data'ya gömülür.
  const photoFileRef = useRef<HTMLInputElement>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  async function handlePhotoFile(file: File | null) {
    if (!file) return
    setPhotoError(null)
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setPhotoError(t.cvBuilder.photoTypeError)
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError(t.cvBuilder.photoSizeError)
      return
    }
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setPersonal({ photo: dataUrl })
    } catch {
      setPhotoError(t.common.error)
    } finally {
      if (photoFileRef.current) photoFileRef.current.value = ''
    }
  }

  // AI profesyonellik denetimi: önce kaydet, sonra kayıtlı CV'yi denetle.
  const [reviewing, setReviewing] = useState(false)
  const [review, setReview] = useState<CvReviewResult | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)

  async function handleReview() {
    setReviewing(true)
    setReviewError(null)
    setReview(null)
    const ok = await handleSave()
    if (!ok) {
      setReviewError(t.cvBuilder.reviewSaveError)
      setReviewing(false)
      return
    }
    try {
      const res = await fetch('/api/cv/review', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setReviewError(json.error?.message ?? t.common.error)
        return
      }
      setReview(json.data as CvReviewResult)
    } catch {
      setReviewError(t.common.connectionError)
    } finally {
      setReviewing(false)
    }
  }

  function addSkill(raw: string) {
    const value = raw.trim().replace(/,$/, '')
    if (!value || cv.skills.includes(value)) return
    patch({ skills: [...cv.skills, value] })
    setSkillInput('')
  }

  const certFileRef = useRef<HTMLInputElement>(null)
  const [certUploading, setCertUploading] = useState(false)
  const [certError, setCertError] = useState<string | null>(null)

  // Sertifika dosyası yükle → AI alanları + ilgili becerileri çıkarıp CV'ye ekler.
  async function handleCertFile(file: File | null) {
    if (!file) return
    setCertUploading(true)
    setCertError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/cv/parse-certificate', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setCertError(json.error?.message ?? t.common.error)
        return
      }
      const c = json.data as { name: string; issuer: string; date: string; skills: string[] }
      setCv((prev) => {
        const newSkills = (c.skills ?? []).filter((s) => s && !prev.skills.includes(s))
        return {
          ...prev,
          certifications: [...prev.certifications, { name: c.name || '', issuer: c.issuer || '', date: c.date || '' }],
          skills: [...prev.skills, ...newSkills],
        }
      })
      setSaved(false)
    } catch {
      setCertError(t.common.connectionError)
    } finally {
      setCertUploading(false)
      if (certFileRef.current) certFileRef.current.value = ''
    }
  }

  return (
    <div className="space-y-5">
      {/* Üst araç çubuğu — başlık + her zaman görünür aksiyonlar */}
      <div className="sticky top-0 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/90 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">{t.cvBuilder.title}</h1>
          <p className="hidden text-xs text-slate-500 sm:block">{t.cvBuilder.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="hidden items-center gap-1 text-xs font-medium text-emerald-600 sm:flex">
              <Check className="h-3.5 w-3.5" />
              {t.common.saved}
            </span>
          )}
          <Button onClick={handleSave} disabled={saving} variant="primary">
            {saving ? <Spinner /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t.common.save}
          </Button>
          <a href={`/api/cv/pdf?template=${template}`}>
            <Button variant="secondary">
              <Download className="h-4 w-4" />
              {t.cvBuilder.downloadPdf}
            </Button>
          </a>
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Editor */}
        <div className="space-y-4">

        {/* Mevcut CV'yi içe aktar */}
        <Card className="space-y-2">
          <input
            ref={importFileRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => handleImportFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            disabled={importing}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-purple-300 bg-purple-50 px-3 py-2.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50"
          >
            {importing ? <Spinner /> : <Upload className="h-4 w-4" />}
            {importing ? t.cvBuilder.importing : t.cvBuilder.importCv}
          </button>
          <p className="text-[11px] text-slate-400">{t.cvBuilder.importHint}</p>
          {importError && <p className="text-xs text-red-500">{importError}</p>}
        </Card>

        {/* Kişisel */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">{t.cvBuilder.personal}</h2>

          {/* Profesyonel fotoğraf */}
          <div className="flex items-center gap-3">
            {cv.personal.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cv.personal.photo} alt={t.cvBuilder.photo} className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                <ImageIcon className="h-6 w-6" />
              </div>
            )}
            <div className="space-y-1">
              <input
                ref={photoFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handlePhotoFile(e.target.files?.[0] ?? null)}
              />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => photoFileRef.current?.click()} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
                  {cv.personal.photo ? t.cvBuilder.photoChange : t.cvBuilder.photoUpload}
                </button>
                {cv.personal.photo && (
                  <button type="button" onClick={() => setPersonal({ photo: '' })} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 transition-colors hover:bg-red-50">
                    {t.cvBuilder.photoRemove}
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">{t.cvBuilder.photoHint}</p>
            </div>
          </div>
          {photoError && <p className="text-xs text-red-500">{photoError}</p>}

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
                <button onClick={() => setPersonal({ links: cv.personal.links.filter((_, idx) => idx !== i) })} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <AddButton label={t.cvBuilder.addLink} onClick={() => setPersonal({ links: [...cv.personal.links, { label: '', url: '' }] })} />
          </div>
          <p className="text-[11px] text-slate-400">{t.cvBuilder.linkHint}</p>
        </Card>

        {/* Özet */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">{t.cvBuilder.summary}</h2>
          <textarea className={inputClass} rows={4} placeholder={t.cvBuilder.summaryPlaceholder} value={cv.summary} onChange={(e) => patch({ summary: e.target.value })} />
        </Card>

        {/* Deneyim */}
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">{t.cvBuilder.experience}</h2>
          <p className="text-[11px] text-slate-400">{t.cvBuilder.experienceHint}</p>
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
              <label className="flex items-center gap-2 text-xs text-slate-500">
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
          <h2 className="text-sm font-semibold text-slate-900">{t.cvBuilder.education}</h2>
          <p className="text-[11px] text-slate-400">{t.cvBuilder.educationHint}</p>
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
          <h2 className="text-sm font-semibold text-slate-900">{t.cvBuilder.skills}</h2>
          <div className="flex flex-wrap gap-1.5">
            {cv.skills.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs text-purple-700">
                {s}
                <button onClick={() => patch({ skills: cv.skills.filter((_, idx) => idx !== i) })} className="hover:text-slate-900">
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
          <h2 className="text-sm font-semibold text-slate-900">{t.cvBuilder.projects}</h2>
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
          <h2 className="text-sm font-semibold text-slate-900">{t.cvBuilder.languages}</h2>
          <p className="text-[11px] text-slate-400">{t.cvBuilder.languagesHint}</p>
          {cv.languages.map((l, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputClass} placeholder={t.cvBuilder.langName} value={l.name} onChange={(e) => patch({ languages: cv.languages.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) })} />
              <input className={inputClass} placeholder={t.cvBuilder.langLevel} value={l.level} onChange={(e) => patch({ languages: cv.languages.map((x, idx) => (idx === i ? { ...x, level: e.target.value } : x)) })} />
              <button onClick={() => patch({ languages: cv.languages.filter((_, idx) => idx !== i) })} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <AddButton label={t.cvBuilder.addLanguage} onClick={() => patch({ languages: [...cv.languages, { ...emptyLanguage }] })} />
        </Card>

        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">{t.cvBuilder.certifications}</h2>
          {cv.certifications.map((c, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputClass} placeholder={t.cvBuilder.certName} value={c.name} onChange={(e) => patch({ certifications: cv.certifications.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) })} />
              <input className={inputClass} placeholder={t.cvBuilder.certIssuer} value={c.issuer} onChange={(e) => patch({ certifications: cv.certifications.map((x, idx) => (idx === i ? { ...x, issuer: e.target.value } : x)) })} />
              <input className={`${inputClass} max-w-[90px]`} placeholder={t.cvBuilder.certYear} value={c.date} onChange={(e) => patch({ certifications: cv.certifications.map((x, idx) => (idx === i ? { ...x, date: e.target.value } : x)) })} />
              <button onClick={() => patch({ certifications: cv.certifications.filter((_, idx) => idx !== i) })} className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <AddButton label={t.cvBuilder.addCertification} onClick={() => patch({ certifications: [...cv.certifications, { ...emptyCertification }] })} />

          {/* Dosyadan AI ile ekle */}
          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            <input
              ref={certFileRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => handleCertFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => certFileRef.current?.click()}
              disabled={certUploading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-purple-300 bg-purple-50 px-3 py-2.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50"
            >
              {certUploading ? <Spinner /> : <Sparkles className="h-4 w-4" />}
              {certUploading ? t.cvBuilder.certParsing : t.cvBuilder.uploadCert}
            </button>
            <p className="text-[11px] text-slate-400">{t.cvBuilder.uploadCertHint}</p>
            {certError && <p className="text-xs text-red-500">{certError}</p>}
          </div>
        </Card>
      </div>

      {/* Önizleme + şablon + AI */}
      <div className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
        <TemplatePicker value={template} onChange={setTemplate} />

        {/* Canlı önizleme — seçilen şablonun vurgu rengiyle */}
        <div>
          <CvPreview data={cv} template={template} />
          <p className="mt-2 text-center text-[11px] text-slate-400">{t.cvBuilder.pdfNote}</p>
        </div>

        {/* Profesyonellik kontrolü (AI) */}
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              {t.cvBuilder.reviewTitle}
            </h2>
            <Button onClick={handleReview} disabled={reviewing} variant="secondary">
              {reviewing ? <Spinner /> : <Sparkles className="h-4 w-4" />}
              {reviewing ? t.cvBuilder.reviewing : t.cvBuilder.reviewCta}
            </Button>
          </div>
          <p className="text-[11px] text-slate-400">{t.cvBuilder.reviewHint}</p>
          {reviewError && <p className="text-xs text-red-500">{reviewError}</p>}
          {review && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-slate-900">
                  {review.score}
                  <span className="text-sm font-medium text-slate-400">/100</span>
                </div>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${review.score}%` }} />
                </div>
              </div>
              {review.strengths.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-emerald-600">{t.cvBuilder.reviewStrengths}</p>
                  <ul className="space-y-1">
                    {review.strengths.map((s, i) => (
                      <li key={i} className="flex gap-1.5 text-xs text-slate-600">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {review.improvements.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold text-amber-600">{t.cvBuilder.reviewImprovements}</p>
                  <ul className="space-y-1.5">
                    {review.improvements.map((im, i) => (
                      <li key={i} className="text-xs text-slate-600">
                        <span className="font-medium text-slate-800">{im.section}:</span> {im.tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
      </div>
    </div>
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-purple-500/40 hover:text-purple-700">
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
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white/[0.03] p-3">
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => onMove(index - 1)} disabled={index === 0} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30">
          <ChevronUp className="h-4 w-4" />
        </button>
        <button onClick={() => onMove(index + 1)} disabled={index === total - 1} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30">
          <ChevronDown className="h-4 w-4" />
        </button>
        <button onClick={onRemove} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {children}
    </div>
  )
}
