'use client'

import { useState } from 'react'
import { Download, Sparkles, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { MIN_APPLY_SCORE, getApplyReadiness } from '@/utils/constants'

interface CvTailorCardProps {
  applicationId: string
  initialScore?: number | null
  hasTailoredCv: boolean
}

export function CvTailorCard({ applicationId, initialScore, hasTailoredCv }: CvTailorCardProps) {
  const [score, setScore] = useState(initialScore ?? null)
  const [suggestions, setSuggestions] = useState<string[] | null>(null)
  const [ready, setReady] = useState(hasTailoredCv)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleTailor() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/tailor-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      setScore(json.data.score)
      setSuggestions(json.data.suggestions)
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
        <h3 className="text-sm font-semibold text-white">Başvuru Hazırlık Skoru</h3>
        {score !== null && (
          <span className="text-2xl font-bold text-amber-500">%{score}</span>
        )}
      </div>

      <p className="text-sm text-white/50">
        AI, CV&apos;ni bu ilana göre yeniden düzenler ve başvuruya ne kadar hazır olduğunu
        puanlar. Yukarıdaki &quot;Sektöre Özel Belgeler&quot; bölümünde işaretlediğin
        belgeler de bu skoru etkiler. Skor en az <strong>{MIN_APPLY_SCORE}</strong> olduğunda
        optimize edilmiş CV&apos;ni PDF olarak indirip başvurunda kullanabilirsin.
      </p>

      {readiness && <p className={`text-sm font-medium ${readiness.className}`}>{readiness.label}</p>}

      {suggestions && suggestions.length > 0 && (
        <ul className="space-y-2">
          {suggestions.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-white/70">
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
