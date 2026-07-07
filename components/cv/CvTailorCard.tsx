'use client'

import { useState } from 'react'
import { Download, Sparkles, CheckCircle2, Gift } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { TemplatePicker, type CvTemplate } from '@/components/cv/TemplatePicker'
import { MIN_APPLY_SCORE, getApplyReadiness } from '@/utils/constants'
import { useI18n } from '@/components/i18n/I18nProvider'
import { format } from '@/lib/i18n'

interface CvTailorCardProps {
  applicationId: string
  initialScore?: number | null
  hasTailoredCv: boolean
  /** Pro/deneme → sınırsız uyarlama. false ise ücretsiz kredi modeli geçerli. */
  isPro?: boolean
  /** Ücretsiz kullanıcının kalan ömür boyu CV uyarlama kredisi. */
  freeCredits?: number
}

export function CvTailorCard({
  applicationId,
  initialScore,
  hasTailoredCv,
  isPro = true,
  freeCredits = 0,
}: CvTailorCardProps) {
  const { t } = useI18n()
  const [score, setScore] = useState(initialScore ?? null)
  const [suggestions, setSuggestions] = useState<string[] | null>(null)
  const [ready, setReady] = useState(hasTailoredCv)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [template, setTemplate] = useState<CvTemplate>('vitrin')
  // Ücretsiz kalan kredi; başarılı uyarlamadan sonra yerelde düşer.
  const [credits, setCredits] = useState(freeCredits)

  // Ücretsiz kullanıcı ve kredisi kalmadı → uyarlama yapamaz, sadece Pro daveti.
  const outOfCredits = !isPro && credits <= 0

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
        setError(json.error?.message ?? t.common.error)
        return
      }
      setScore(json.data.score)
      setSuggestions(json.data.suggestions)
      setReady(true)
      if (!isPro) setCredits((c) => Math.max(0, c - 1))
    } catch {
      setError(t.common.connectionError)
    } finally {
      setLoading(false)
    }
  }

  const readiness = score !== null ? getApplyReadiness(score) : null
  const canDownload = ready && score !== null && score >= MIN_APPLY_SCORE

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{t.cvTailor.title}</h3>
        {score !== null && (
          <span className="text-2xl font-bold text-purple-600">%{score}</span>
        )}
      </div>

      <p className="text-sm text-slate-500">
        {format(t.cvTailor.desc, { min: MIN_APPLY_SCORE })}
      </p>

      {!isPro && !outOfCredits && (
        <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700">
          <Gift className="h-4 w-4 shrink-0" />
          <span>{format(t.cvTailor.freeBadge, { n: credits })}</span>
        </div>
      )}

      {readiness && <p className={`text-sm font-medium ${readiness.className}`}>{t.readiness[readiness.levelKey]}</p>}

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

      {ready && canDownload && <TemplatePicker value={template} onChange={setTemplate} />}

      {outOfCredits && (
        <div className="flex flex-col gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-purple-700">{t.cvTailor.freeExhausted}</p>
          <div className="shrink-0">
            <UpgradeButton planId="pro" label={t.cvTailor.upgradeCta} />
          </div>
        </div>
      )}

      {!isPro && !outOfCredits && (
        <p className="text-xs text-slate-400">{t.cvTailor.freeHint}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {!outOfCredits && (
          <Button onClick={handleTailor} disabled={loading} variant="secondary">
            {loading ? (
              <Spinner />
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {score === null ? t.cvTailor.optimize : t.cvTailor.reoptimize}
              </>
            )}
          </Button>
        )}

        {ready && (
          <a
            href={canDownload ? `/api/applications/${applicationId}/cv-pdf?type=cv&template=${template}` : undefined}
            aria-disabled={!canDownload}
            onClick={(e) => {
              if (!canDownload) e.preventDefault()
            }}
          >
            <Button variant={canDownload ? 'primary' : 'secondary'} disabled={!canDownload}>
              <Download className="h-4 w-4" />
              {t.cvTailor.download}
            </Button>
          </a>
        )}
      </div>
    </Card>
  )
}
