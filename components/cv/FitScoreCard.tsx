'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'

interface FitScoreCardProps {
  applicationId: string
  initialScore?: number | null
  initialSuggestions?: string[] | null
}

export function FitScoreCard({
  applicationId,
  initialScore,
  initialSuggestions,
}: FitScoreCardProps) {
  const { t } = useI18n()
  const [score, setScore] = useState(initialScore ?? null)
  const [suggestions, setSuggestions] = useState(initialSuggestions ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/fit-score', {
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
    } catch {
      setError(t.common.connectionError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{t.fitScore.title}</h3>
        {score !== null && (
          <span className="text-2xl font-bold text-amber-500">%{score}</span>
        )}
      </div>

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

      <Button onClick={handleAnalyze} disabled={loading} variant="secondary">
        {loading ? <Spinner /> : score === null ? t.fitScore.calc : t.fitScore.recalc}
      </Button>
    </Card>
  )
}
