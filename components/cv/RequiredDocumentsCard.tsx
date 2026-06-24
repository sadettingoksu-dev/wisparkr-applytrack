'use client'

import { useRef, useState } from 'react'
import { FileSearch, Upload, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { RequiredDocument } from '@/lib/types'

interface RequiredDocumentsCardProps {
  applicationId: string
  initialDocuments?: RequiredDocument[] | null
}

const IMPORTANCE_CLASS: Record<RequiredDocument['importance'], string> = {
  critical: 'bg-red-500/10 text-red-400',
  important: 'bg-purple-50 text-purple-600',
  optional: 'bg-slate-100 text-slate-600',
}

export function RequiredDocumentsCard({ applicationId, initialDocuments }: RequiredDocumentsCardProps) {
  const { t } = useI18n()
  const [documents, setDocuments] = useState<RequiredDocument[] | null>(initialDocuments ?? null)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([])

  async function handleAnalyzeDocuments() {
    setLoadingDocs(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/required-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.common.error)
        return
      }
      setDocuments(json.data.documents)
    } catch {
      setError(t.common.connectionError)
    } finally {
      setLoadingDocs(false)
    }
  }

  async function toggleDocument(index: number, has: boolean) {
    setError(null)
    try {
      const res = await fetch(`/api/applications/${applicationId}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index, has }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.common.error)
        return
      }
      setDocuments(json.data.documents)
    } catch {
      setError(t.common.connectionError)
    }
  }

  async function handleFileChange(index: number, file: File | undefined) {
    if (!file) return
    setError(null)
    setUploadingIndex(index)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('index', String(index))
      const res = await fetch(`/api/applications/${applicationId}/documents/upload`, {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.common.error)
        return
      }
      setDocuments(json.data.documents)
    } catch {
      setError(t.common.connectionError)
    } finally {
      setUploadingIndex(null)
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">{t.requiredDocs.title}</h2>
        <p className="text-sm text-slate-500">
          {t.requiredDocs.desc}
        </p>
      </div>

      {!documents && (
        <Button onClick={handleAnalyzeDocuments} disabled={loadingDocs} variant="secondary">
          {loadingDocs ? (
            <Spinner />
          ) : (
            <>
              <FileSearch className="h-4 w-4" />
              {t.requiredDocs.detect}
            </>
          )}
        </Button>
      )}

      {documents && documents.length === 0 && (
        <p className="text-sm text-slate-500">
          {t.requiredDocs.none}
        </p>
      )}

      {documents && documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((doc, i) => (
            <li
              key={`${doc.name}-${i}`}
              className="space-y-2 rounded-lg border border-slate-200 px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-800">{doc.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${IMPORTANCE_CLASS[doc.importance]}`}>
                    {t.requiredDocs.importance[doc.importance]}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleDocument(i, true)}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      doc.has === true ? 'bg-emerald-600 text-slate-900' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t.requiredDocs.has}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDocument(i, false)}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      doc.has === false ? 'bg-red-600 text-slate-900' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t.requiredDocs.hasNot}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={(el) => {
                    fileInputRefs.current[i] = el
                  }}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(i, e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="text-xs"
                  disabled={uploadingIndex === i}
                  onClick={() => fileInputRefs.current[i]?.click()}
                >
                  {uploadingIndex === i ? (
                    <Spinner />
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" />
                      {doc.filename ? t.requiredDocs.replace : t.requiredDocs.upload}
                    </>
                  )}
                </Button>
                {doc.filename && (
                  <span className="flex items-center gap-1 text-xs text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {doc.filename}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </Card>
  )
}
