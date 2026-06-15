'use client'

import { useState } from 'react'
import { Download, Sparkles, CheckCircle2, FileSearch } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { MIN_APPLY_SCORE, getApplyReadiness } from '@/utils/constants'
import type { RequiredDocument } from '@/lib/types'

interface CvTailorCardProps {
  applicationId: string
  initialScore?: number | null
  hasTailoredCv: boolean
  initialDocuments?: RequiredDocument[] | null
}

const IMPORTANCE_LABEL: Record<RequiredDocument['importance'], string> = {
  critical: 'Kritik',
  important: 'Önemli',
  optional: 'Opsiyonel',
}

const IMPORTANCE_CLASS: Record<RequiredDocument['importance'], string> = {
  critical: 'bg-red-50 text-red-700',
  important: 'bg-amber-50 text-amber-700',
  optional: 'bg-slate-100 text-slate-600',
}

export function CvTailorCard({
  applicationId,
  initialScore,
  hasTailoredCv,
  initialDocuments,
}: CvTailorCardProps) {
  const [score, setScore] = useState(initialScore ?? null)
  const [suggestions, setSuggestions] = useState<string[] | null>(null)
  const [ready, setReady] = useState(hasTailoredCv)
  const [documents, setDocuments] = useState<RequiredDocument[] | null>(
    initialDocuments && initialDocuments.length > 0 ? initialDocuments : null
  )
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  function toggleDocument(index: number, has: boolean) {
    setDocuments((prev) => {
      if (!prev) return prev
      const next = [...prev]
      next[index] = { ...next[index], has }
      return next
    })
  }

  async function handleTailor() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/tailor-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: applicationId,
          ...(documents ? { documents } : {}),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      setScore(json.data.score)
      setSuggestions(json.data.suggestions)
      setDocuments(json.data.documents)
      setReady(true)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  const readiness = score !== null ? getApplyReadiness(score) : null
  const canDownload = ready && score !== null && score >= MIN_APPLY_SCORE

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Başvuru Hazırlık Skoru</h3>
        {score !== null && (
          <span className="text-2xl font-bold text-purple-600">%{score}</span>
        )}
      </div>

      <p className="text-sm text-slate-500">
        AI, CV&apos;ni bu ilana göre yeniden düzenler ve başvuruya ne kadar hazır olduğunu
        puanlar. Skor en az <strong>{MIN_APPLY_SCORE}</strong> olduğunda optimize edilmiş CV&apos;ni
        PDF olarak indirip başvurunda kullanabilirsin.
      </p>

      {readiness && <p className={`text-sm font-medium ${readiness.className}`}>{readiness.label}</p>}

      {documents === null && (
        <Button onClick={handleAnalyzeDocuments} disabled={loadingDocs} variant="secondary">
          {loadingDocs ? (
            <Spinner />
          ) : (
            <>
              <FileSearch className="h-4 w-4" />
              Bu İlan İçin Gerekli Belgeleri Kontrol Et
            </>
          )}
        </Button>
      )}

      {documents && documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500">
            Bu sektördeki başvurular için genellikle istenen belgeler:
          </p>
          <ul className="space-y-2">
            {documents.map((doc, i) => (
              <li
                key={`${doc.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700">{doc.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${IMPORTANCE_CLASS[doc.importance]}`}>
                    {IMPORTANCE_LABEL[doc.importance]}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => toggleDocument(i, true)}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      doc.has === true ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Var
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDocument(i, false)}
                    className={`rounded-md px-2 py-1 text-xs font-medium ${
                      doc.has === false ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Yok
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
              {s}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleTailor} disabled={loading} variant="secondary">
          {loading ? (
            <Spinner />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {score === null ? "CV'yi Bu İlana Göre Optimize Et" : 'Yeniden Optimize Et'}
            </>
          )}
        </Button>

        {ready && (
          <a
            href={canDownload ? `/api/applications/${applicationId}/cv-pdf` : undefined}
            aria-disabled={!canDownload}
            onClick={(e) => {
              if (!canDownload) e.preventDefault()
            }}
          >
            <Button variant={canDownload ? 'primary' : 'secondary'} disabled={!canDownload}>
              <Download className="h-4 w-4" />
              Başvuru CV&apos;sini İndir (PDF)
            </Button>
          </a>
        )}
      </div>
    </Card>
  )
}
