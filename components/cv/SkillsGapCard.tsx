'use client'

import { useState } from 'react'
import { Target, Check, X, Sparkles } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

interface SkillsGap {
  matched: string[]
  missing: string[]
  summary: string
}

interface SkillsGapCardProps {
  applicationId: string
  initialData?: SkillsGap | null
}

export function SkillsGapCard({ applicationId, initialData }: SkillsGapCardProps) {
  const [data, setData] = useState<SkillsGap | null>(initialData ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/skills-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      setData(json.data)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-white">Beceri Açığı Analizi</h3>
      </div>
      <p className="text-sm text-white/50">
        AI, ilanın istediği becerileri CV&apos;ndekilerle karşılaştırır: hangileri var, hangileri
        eksik? Eksikleri kapatmak için CV&apos;ni bu ilana göre optimize edebilirsin.
      </p>

      {data && (
        <div className="space-y-3">
          {data.summary && <p className="text-sm text-white/70">{data.summary}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-medium text-emerald-400">CV&apos;nde olanlar</p>
              <div className="flex flex-wrap gap-1.5">
                {data.matched.length === 0 ? (
                  <span className="text-xs text-white/30">—</span>
                ) : (
                  data.matched.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300"
                    >
                      <Check className="h-3 w-3" />
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-red-400">Eksik olanlar</p>
              <div className="flex flex-wrap gap-1.5">
                {data.missing.length === 0 ? (
                  <span className="text-xs text-white/30">—</span>
                ) : (
                  data.missing.map((s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-300"
                    >
                      <X className="h-3 w-3" />
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button onClick={handleAnalyze} disabled={loading} variant="secondary">
        {loading ? (
          <Spinner />
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            {data ? 'Yeniden Analiz Et' : 'Beceri Açığını Analiz Et'}
          </>
        )}
      </Button>
    </Card>
  )
}
