'use client'

import { useRef, useState } from 'react'
import { FileSearch, Upload, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { RequiredDocument } from '@/lib/types'

interface RequiredDocumentsCardProps {
  applicationId: string
  initialDocuments?: RequiredDocument[] | null
}

const IMPORTANCE_LABEL: Record<RequiredDocument['importance'], string> = {
  critical: 'Kritik',
  important: 'Önemli',
  optional: 'Opsiyonel',
}

const IMPORTANCE_CLASS: Record<RequiredDocument['importance'], string> = {
  critical: 'bg-red-500/10 text-red-400',
  important: 'bg-amber-500/10 text-amber-400',
  optional: 'bg-white/10 text-white/70',
}

export function RequiredDocumentsCard({ applicationId, initialDocuments }: RequiredDocumentsCardProps) {
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
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      setDocuments(json.data.documents)
    } catch {
      setError('Bağlantı hatası.')
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
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      setDocuments(json.data.documents)
    } catch {
      setError('Bağlantı hatası.')
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
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      setDocuments(json.data.documents)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setUploadingIndex(null)
    }
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-white">Sektöre Özel Belgeler</h2>
        <p className="text-sm text-white/50">
          AI, bu ilanın sektörüne göre adaylardan genellikle istenen ek belge/sertifikaları
          tespit eder. Elindeki belgeleri (PDF) yükle veya &quot;Yok&quot; olarak işaretle —
          bu bilgiler CV optimizasyon skorunu ve önerileri etkiler.
        </p>
      </div>

      {!documents && (
        <Button onClick={handleAnalyzeDocuments} disabled={loadingDocs} variant="secondary">
          {loadingDocs ? (
            <Spinner />
          ) : (
            <>
              <FileSearch className="h-4 w-4" />
              Bu İlan İçin Gerekli Belgeleri Tespit Et
            </>
          )}
        </Button>
      )}

      {documents && documents.length === 0 && (
        <p className="text-sm text-white/50">
          Bu ilan için sektöre özel ek bir belge gerekmiyor gibi görünüyor.
        </p>
      )}

      {documents && documents.length > 0 && (
        <ul className="space-y-2">
          {documents.map((doc, i) => (
            <li
              key={`${doc.name}-${i}`}
              className="space-y-2 rounded-lg border border-white/10 px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/90">{doc.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${IMPORTANCE_CLASS[doc.importance]}`}>
                    {IMPORTANCE_LABEL[doc.importance]}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleDocument(i, true)}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      doc.has === true ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    Var
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDocument(i, false)}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      doc.has === false ? 'bg-red-600 text-white' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    Yok
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
                      {doc.filename ? 'Belgeyi Değiştir' : 'Belge Yükle (PDF)'}
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
