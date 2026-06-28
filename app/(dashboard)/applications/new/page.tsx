'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'

export default function NewApplicationPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [positionTitle, setPositionTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [parsed, setParsed] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitInfo, setLimitInfo] = useState<{ used: number; max: number | null } | null>(null)

  useEffect(() => {
    fetch('/api/applications/limit')
      .then((r) => r.json())
      .then((json) => {
        if (json.data?.reached) {
          router.replace('/applications?limit=1')
        } else {
          setLimitInfo(json.data)
        }
      })
      .catch(() => {})
  }, [router])

  async function handleParse() {
    if (!url) return
    setParsing(true)
    setError(null)
    try {
      const res = await fetch('/api/jobs/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error?.message ?? t.newApp.parseError); setParsed(false); return }
      setCompanyName(json.data.company_name)
      setPositionTitle(json.data.position_title)
      setJobDescription(json.data.job_description)
      setParsed(true)
    } catch { setError(t.common.connectionError); setParsed(false) }
    finally { setParsing(false) }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_name: companyName,
        position_title: positionTitle,
        job_url: url || undefined,
        job_description: jobDescription || undefined,
      }),
    })
    const json = await res.json()
    if (!res.ok) {
      if (json.error?.code === 'PLAN_LIMIT_EXCEEDED') {
        router.replace('/applications?limit=1')
      } else {
        setError(json.error?.message ?? t.newApp.saveError)
        setSaving(false)
      }
      return
    }
    router.push('/board')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.newApp.title}</h1>
          <p className="text-sm text-slate-500">{t.newApp.subtitle}</p>
        </div>
        {limitInfo?.max !== null && limitInfo && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            {limitInfo.used}/{limitInfo.max} {t.newApp.applicationsSuffix}
          </span>
        )}
      </div>

      <Card className="space-y-3">
        <label className="text-sm font-medium text-slate-800">{t.newApp.urlLabel}</label>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://www.linkedin.com/jobs/view/..."
            value={url}
            onChange={(e) => { setUrl(e.target.value); setParsed(false) }}
          />
          <Button onClick={handleParse} disabled={parsing || !url} variant="secondary">
            {parsing ? <Spinner /> : t.newApp.fill}
          </Button>
        </div>
        <p className="text-xs text-slate-500">{t.newApp.urlHint}</p>
        <p className="text-xs text-slate-400">{t.newApp.exampleSources}</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </Card>

      {parsed && (
        <form onSubmit={handleSave}>
          <Card className="space-y-4">
            <p className="text-xs font-medium text-purple-600">{t.newApp.aiFilledHint}</p>
            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-800">{t.newApp.companyLabel}</span>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-900">
                {companyName || '—'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-800">{t.newApp.positionLabel}</span>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-900">
                {positionTitle || '—'}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-slate-800">{t.newApp.descLabel}</span>
              <p className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                {jobDescription || '—'}
              </p>
            </div>
            <Button type="submit" disabled={saving || !companyName || !positionTitle}>
              {saving ? <Spinner /> : t.common.save}
            </Button>
          </Card>
        </form>
      )}
    </div>
  )
}
