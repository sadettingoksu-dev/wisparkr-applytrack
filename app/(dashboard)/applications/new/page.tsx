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
      if (!res.ok) { setError(json.error?.message ?? t.newApp.parseError); return }
      setCompanyName(json.data.company_name)
      setPositionTitle(json.data.position_title)
      setJobDescription(json.data.job_description)
    } catch { setError(t.common.connectionError) }
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
          <h1 className="text-2xl font-bold text-white">{t.newApp.title}</h1>
          <p className="text-sm text-white/50">{t.newApp.subtitle}</p>
        </div>
        {limitInfo?.max !== null && limitInfo && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/50">
            {limitInfo.used}/{limitInfo.max} {t.newApp.applicationsSuffix}
          </span>
        )}
      </div>

      <Card className="space-y-3">
        <label className="text-sm font-medium text-white/90">{t.newApp.urlLabel}</label>
        <div className="flex gap-2">
          <Input type="url" placeholder="https://www.linkedin.com/jobs/view/..." value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button onClick={handleParse} disabled={parsing || !url} variant="secondary">
            {parsing ? <Spinner /> : t.newApp.fill}
          </Button>
        </div>
      </Card>

      <form onSubmit={handleSave}>
        <Card className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/90">{t.newApp.companyLabel}</label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/90">{t.newApp.positionLabel}</label>
            <Input value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-white/90">{t.newApp.descLabel}</label>
            <textarea
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              rows={6} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={saving || !companyName || !positionTitle}>
            {saving ? <Spinner /> : t.common.save}
          </Button>
        </Card>
      </form>
    </div>
  )
}
