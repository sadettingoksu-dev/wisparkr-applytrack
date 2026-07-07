'use client'

import { useState } from 'react'
import { Users, Sparkles, TrendingUp, Target } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { CompetitorAnalysisResult } from '@/lib/types'

interface CompetitorAnalysisCardProps {
  applicationId: string
  initialResult?: CompetitorAnalysisResult | null
}

export function CompetitorAnalysisCard({ applicationId, initialResult }: CompetitorAnalysisCardProps) {
  const { t } = useI18n()
  const [result, setResult] = useState<CompetitorAnalysisResult | null>(initialResult ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function analyze() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/competitor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.common.error)
        return
      }
      setResult(json.data.result)
    } catch {
      setError(t.common.connectionError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">{t.competitor.title}</h2>
            <p className="text-sm text-slate-500">{t.competitor.desc}</p>
          </div>
        </div>
        {result && (
          <div className="shrink-0 text-right">
            <span className="text-2xl font-bold text-purple-600">%{result.positioning_score}</span>
            <p className="text-[11px] text-slate-400">{t.competitor.scoreLabel}</p>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {result && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">{result.summary}</p>

          {result.typical_profile.length > 0 && (
            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                {t.competitor.typicalLabel}
              </h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {result.typical_profile.map((p, i) => (
                  <li
                    key={i}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                  >
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 p-3">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              {t.competitor.standingLabel}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{result.your_standing}</p>
          </div>

          {result.differentiators.length > 0 && (
            <div>
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Target className="h-3.5 w-3.5 text-purple-500" />
                {t.competitor.diffLabel}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {result.differentiators.map((d, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-500" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Button onClick={analyze} disabled={loading} variant="secondary">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {result ? t.competitor.reanalyze : t.competitor.analyze}
          </>
        )}
      </Button>
    </Card>
  )
}
