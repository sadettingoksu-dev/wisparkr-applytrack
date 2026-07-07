'use client'

import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Wrench,
  Stethoscope,
  Download,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Gift,
  FileText,
  Lightbulb,
  Briefcase,
  Hash,
  LayoutTemplate,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { TemplatePicker, type CvTemplate } from '@/components/cv/TemplatePicker'
import { MIN_APPLY_SCORE, getApplyReadiness } from '@/utils/constants'
import { useI18n } from '@/components/i18n/I18nProvider'
import { format } from '@/lib/i18n'
import type {
  CvDiagnosisResult,
  CvDiagnosisItem,
  CvDiagnosisCategory,
  CvDiagnosisSeverity,
  RequiredDocument,
} from '@/lib/types'

interface CvRepairWizardProps {
  applicationId: string
  /** Pro/deneme → sınırsız optimize. false ise ücretsiz kredi modeli. */
  isPro?: boolean
  /** Ücretsiz kullanıcının kalan ömür boyu CV uyarlama kredisi. */
  freeCredits?: number
  initialDiagnosis?: CvDiagnosisResult | null
  initialTailoredScore?: number | null
  hasTailoredCv?: boolean
}

type Step = 'diagnose' | 'repair' | 'deliver'

const STEP_ORDER: Step[] = ['diagnose', 'repair', 'deliver']

const SEVERITY_CLASS: Record<CvDiagnosisSeverity, string> = {
  critical: 'bg-red-500/10 text-red-500',
  important: 'bg-purple-50 text-purple-600',
  minor: 'bg-slate-100 text-slate-600',
}

const CATEGORY_ICON: Record<CvDiagnosisCategory, typeof FileText> = {
  document: FileText,
  skill: Lightbulb,
  experience: Briefcase,
  keyword: Hash,
  format: LayoutTemplate,
}

/** Teşhis şiddetini tailor-cv'nin beklediği belge önem derecesine eşler. */
const SEVERITY_TO_IMPORTANCE: Record<CvDiagnosisSeverity, RequiredDocument['importance']> = {
  critical: 'critical',
  important: 'important',
  minor: 'optional',
}

export function CvRepairWizard({
  applicationId,
  isPro = true,
  freeCredits = 0,
  initialDiagnosis,
  initialTailoredScore,
  hasTailoredCv = false,
}: CvRepairWizardProps) {
  const { t } = useI18n()
  const [step, setStep] = useState<Step>('diagnose')
  const [diagnosis, setDiagnosis] = useState<CvDiagnosisResult | null>(initialDiagnosis ?? null)
  const [answers, setAnswers] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Teslim (finalize) durumu
  const [finalScore, setFinalScore] = useState<number | null>(initialTailoredScore ?? null)
  const [suggestions, setSuggestions] = useState<string[] | null>(null)
  const [ready, setReady] = useState(hasTailoredCv)
  const [template, setTemplate] = useState<CvTemplate>('vitrin')
  const [credits, setCredits] = useState(freeCredits)
  const [showUpsell, setShowUpsell] = useState(false)

  const outOfCredits = !isPro && credits <= 0

  const docItems = useMemo(
    () => (diagnosis?.items ?? []).filter((it) => it.kind === 'have_or_not'),
    [diagnosis]
  )
  const improveItems = useMemo(
    () => (diagnosis?.items ?? []).filter((it) => it.kind === 'improve'),
    [diagnosis]
  )

  async function runDiagnose() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/cv-repair/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.common.error)
        return
      }
      setDiagnosis(json.data.diagnosis)
      setAnswers({})
    } catch {
      setError(t.common.connectionError)
    } finally {
      setLoading(false)
    }
  }

  async function runFinalize() {
    if (outOfCredits) {
      setShowUpsell(true)
      return
    }
    setLoading(true)
    setError(null)
    setShowUpsell(false)
    try {
      const documents: RequiredDocument[] = docItems.map((it) => ({
        name: it.title,
        importance: SEVERITY_TO_IMPORTANCE[it.severity],
        has: it.id in answers ? answers[it.id] : null,
      }))
      const res = await fetch('/api/ai/tailor-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, documents }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.error?.code === 'FREE_CV_CREDIT_EXHAUSTED') setShowUpsell(true)
        setError(json.error?.message ?? t.common.error)
        return
      }
      setFinalScore(json.data.score)
      setSuggestions(json.data.suggestions)
      setReady(true)
      if (!isPro) setCredits((c) => Math.max(0, c - 1))
    } catch {
      setError(t.common.connectionError)
    } finally {
      setLoading(false)
    }
  }

  function goTo(target: Step) {
    // Teşhis olmadan ileri adımlara geçilemez.
    if (target !== 'diagnose' && !diagnosis) return
    setError(null)
    setStep(target)
  }

  const readiness = finalScore !== null ? getApplyReadiness(finalScore) : null
  const canDownload = ready && finalScore !== null && finalScore >= MIN_APPLY_SCORE
  const beforeScore = diagnosis?.overall_score ?? null

  return (
    <div className="space-y-4">
      {/* Adım göstergesi */}
      <div className="flex items-center gap-2">
        {STEP_ORDER.map((s, i) => {
          const active = step === s
          const enabled = s === 'diagnose' || Boolean(diagnosis)
          const labels = t.cvRepair.steps
          const icon = s === 'diagnose' ? Stethoscope : s === 'repair' ? Wrench : Sparkles
          const Icon = icon
          return (
            <button
              key={s}
              type="button"
              onClick={() => goTo(s)}
              disabled={!enabled}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                active
                  ? 'border-purple-300 bg-purple-50 text-purple-700'
                  : enabled
                    ? 'border-slate-200 bg-white text-slate-500 hover:border-purple-200'
                    : 'border-slate-100 bg-slate-50 text-slate-300'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  active ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {i + 1}
              </span>
              <Icon className="hidden h-4 w-4 sm:block" />
              <span>{labels[s]}</span>
            </button>
          )
        })}
      </div>

      {/* ADIM 1: TEŞHİS */}
      {step === 'diagnose' && (
        <Card className="space-y-4">
          {!diagnosis && (
            <>
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                  <Stethoscope className="h-7 w-7" />
                </div>
                <p className="max-w-md text-sm text-slate-500">{t.cvRepair.intro}</p>
                <Button onClick={runDiagnose} disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner />
                      {t.cvRepair.diagnosing}
                    </>
                  ) : (
                    <>
                      <Stethoscope className="h-4 w-4" />
                      {t.cvRepair.start}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {diagnosis && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-slate-900">{t.cvRepair.currentScore}</h2>
                  <p className="mt-1 text-sm text-slate-500">{diagnosis.summary}</p>
                </div>
                {beforeScore !== null && (
                  <span className="shrink-0 text-3xl font-bold text-purple-600">%{beforeScore}</span>
                )}
              </div>

              {diagnosis.items.length === 0 ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {t.cvRepair.noIssues}
                </p>
              ) : (
                <ul className="space-y-2">
                  {diagnosis.items.map((item) => (
                    <DiagnosisRow key={item.id} item={item} t={t} />
                  ))}
                </ul>
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={runDiagnose} disabled={loading}>
                  {loading ? <Spinner /> : <RefreshCw className="h-4 w-4" />}
                  {t.cvRepair.rediagnose}
                </Button>
                <Button onClick={() => goTo('repair')}>
                  {t.cvRepair.toRepair}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* ADIM 2: ONARIM */}
      {step === 'repair' && diagnosis && (
        <Card className="space-y-4">
          <p className="text-sm text-slate-500">{t.cvRepair.repairIntro}</p>

          {docItems.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              {t.cvRepair.noDocs}
            </p>
          ) : (
            <ul className="space-y-2">
              {docItems.map((item) => {
                const answer = item.id in answers ? answers[item.id] : null
                return (
                  <li key={item.id} className="space-y-2 rounded-lg border border-slate-200 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-800">{item.title}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[item.severity]}`}
                      >
                        {t.cvRepair.severity[item.severity]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{item.diagnosis}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{t.cvRepair.haveQuestion}</span>
                      <button
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [item.id]: true }))}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          answer === true ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.requiredDocs.has}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [item.id]: false }))}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                          answer === false ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.requiredDocs.hasNot}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {improveItems.length > 0 && (
            <div className="space-y-2 rounded-xl border border-purple-100 bg-purple-50/50 p-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-purple-600" />
                <h3 className="text-xs font-semibold text-purple-700">{t.cvRepair.autoFixTitle}</h3>
              </div>
              <ul className="space-y-1.5">
                {improveItems.map((item) => (
                  <li key={item.id} className="flex gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-purple-500" />
                    <span>
                      <span className="font-medium text-slate-700">{item.title}:</span> {item.fix}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-purple-500">{t.cvRepair.autoFixHint}</p>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => goTo('diagnose')}>
              {t.cvRepair.backToDiagnose}
            </Button>
            <Button onClick={() => goTo('deliver')}>
              {t.cvRepair.toDeliver}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ADIM 3: TESLİM */}
      {step === 'deliver' && diagnosis && (
        <Card className="space-y-4">
          {!isPro && !outOfCredits && !ready && (
            <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700">
              <Gift className="h-4 w-4 shrink-0" />
              <span>{format(t.cvTailor.freeBadge, { n: credits })}</span>
            </div>
          )}

          {!ready && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                <Sparkles className="h-7 w-7" />
              </div>
              <p className="max-w-md text-sm text-slate-500">
                {format(t.cvTailor.desc, { min: MIN_APPLY_SCORE })}
              </p>
            </div>
          )}

          {ready && finalScore !== null && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">{t.cvRepair.resultTitle}</h2>
                <div className="flex items-center gap-3">
                  {beforeScore !== null && (
                    <span className="text-sm text-slate-400 line-through">%{beforeScore}</span>
                  )}
                  <span className="text-3xl font-bold text-purple-600">%{finalScore}</span>
                </div>
              </div>
              {beforeScore !== null && finalScore > beforeScore && (
                <p className="text-sm text-emerald-700">
                  {format(t.cvRepair.scoreImproved, { before: beforeScore, after: finalScore })}
                </p>
              )}
              {readiness && (
                <p className={`text-sm font-medium ${readiness.className}`}>
                  {t.readiness[readiness.levelKey]}
                </p>
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
              {canDownload && <TemplatePicker value={template} onChange={setTemplate} />}
            </>
          )}

          {(outOfCredits || showUpsell) && (
            <div className="flex flex-col gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-purple-700">{t.cvTailor.freeExhausted}</p>
              <div className="shrink-0">
                <UpgradeButton planId="pro" label={t.cvTailor.upgradeCta} />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => goTo('repair')}>
              {t.cvRepair.steps.repair}
            </Button>
            {!outOfCredits && (
              <Button onClick={runFinalize} disabled={loading}>
                {loading ? (
                  <>
                    <Spinner />
                    {t.cvRepair.delivering}
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {ready ? t.cvTailor.reoptimize : t.cvRepair.toDeliver}
                  </>
                )}
              </Button>
            )}
            {ready && (
              <a
                href={
                  canDownload
                    ? `/api/applications/${applicationId}/cv-pdf?type=cv&template=${template}`
                    : undefined
                }
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
      )}
    </div>
  )
}

function DiagnosisRow({
  item,
  t,
}: {
  item: CvDiagnosisItem
  t: ReturnType<typeof useI18n>['t']
}) {
  const Icon = CATEGORY_ICON[item.category]
  return (
    <li className="space-y-1.5 rounded-lg border border-slate-200 px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-800">{item.title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_CLASS[item.severity]}`}>
            {t.cvRepair.severity[item.severity]}
          </span>
          {item.impact > 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {format(t.cvRepair.impact, { n: item.impact })}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500">
        <span className="font-medium text-slate-600">{t.cvRepair.diagnosisLabel}:</span> {item.diagnosis}
      </p>
      <p className="text-xs text-slate-500">
        <span className="font-medium text-slate-600">{t.cvRepair.fixLabel}:</span> {item.fix}
      </p>
    </li>
  )
}
