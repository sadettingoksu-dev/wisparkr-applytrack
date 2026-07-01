'use client'

import { useRef, useState } from 'react'
import { UploadCloud, CheckCircle2 } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'
import { SettingsRow } from '@/components/settings/SettingsList'

export function CvUploadCard({ initialFilename }: { initialFilename: string | null }) {
  const { t } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [filename, setFilename] = useState(initialFilename)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleUpload(file: File) {
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/cv/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.settings.cvUploadError)
        return
      }
      setFilename(file.name)
      setSuccess(true)
    } catch {
      setError(t.common.connectionError)
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const desc = error ? (
    <span className="text-red-500">{error}</span>
  ) : success ? (
    <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />{t.settings.cvUploaded}</span>
  ) : (
    <span className="truncate">{filename ?? t.settings.noCv}</span>
  )

  return (
    <SettingsRow label={t.settings.cvFile} description={desc}>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleUpload(f)
        }}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? <Spinner /> : <UploadCloud className="h-3.5 w-3.5" />}
        {loading ? t.settings.uploading : filename ? t.common.edit : t.settings.uploadCv}
      </button>
    </SettingsRow>
  )
}
