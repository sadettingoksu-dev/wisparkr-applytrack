'use client'

import { useState } from 'react'
import { Banknote, Sparkles, Copy, Check, Lightbulb } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { SalaryCoachResult } from '@/lib/types'

interface SalaryCoachCardProps {
  applicationId: string
  initialResult?: SalaryCoachResult | null
}

export function SalaryCoachCard({ applicationId, initialResult }: SalaryCoachCardProps) {
  const { t } = useI18n()
  const [city, setCity] = useState('')
  const [offer, setOffer] = useState('')
  const [result, setResult] = useState<SalaryCoachResult | null>(initialResult ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<number | null>(null)

  async function analyze() {
    if (!city.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/salary-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, city, offer: offer || undefined }),
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

  async function copyScript(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(i)
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1500)
    } catch {
      /* pano erişilemezse geç */
    }
  }

  const fmt = (n: number) => n.toLocaleString('tr-TR')

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Banknote className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{t.salaryCoach.title}</h2>
          <p className="text-sm text-slate-500">{t.salaryCoach.desc}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">{t.salaryCoach.cityLabel}</span>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t.salaryCoach.cityPlaceholder}
            disabled={loading}
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-600">{t.salaryCoach.offerLabel}</span>
          <Input
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder={t.salaryCoach.offerPlaceholder}
            disabled={loading}
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p className="text-xs font-medium text-emerald-700">{t.salaryCoach.rangeLabel}</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {fmt(result.range_low)} – {fmt(result.range_high)} {result.currency}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-700">{t.salaryCoach.assessmentLabel}</h3>
            <p className="mt-1 text-sm text-slate-600">{result.assessment}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-slate-700">{t.salaryCoach.counterLabel}</h3>
            <p className="mt-1 text-sm font-medium text-purple-700">{result.counter_offer}</p>
          </div>

          {result.scripts.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-700">{t.salaryCoach.scriptsLabel}</h3>
              <ul className="mt-2 space-y-2">
                {result.scripts.map((s, i) => (
                  <li key={i} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-slate-500">{s.situation}</p>
                      <button
                        type="button"
                        onClick={() => copyScript(s.message, i)}
                        className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-400 hover:text-purple-600"
                      >
                        {copied === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === i ? t.chat.copied : t.chat.copy}
                      </button>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{s.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.tips.length > 0 && (
            <ul className="space-y-1.5">
              {result.tips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                  {tip}
                </li>
              ))}
            </ul>
          )}

          <p className="text-[11px] text-slate-400">{t.salaryCoach.disclaimer}</p>
        </div>
      )}

      <Button onClick={analyze} disabled={loading || !city.trim()} variant="secondary">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {result ? t.salaryCoach.reanalyze : t.salaryCoach.analyze}
          </>
        )}
      </Button>
    </Card>
  )
}
