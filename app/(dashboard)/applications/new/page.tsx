'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

export default function NewApplicationPage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [positionTitle, setPositionTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      if (!res.ok) {
        setError(json.error?.message ?? 'İlan okunamadı, bilgileri manuel girebilirsiniz.')
        return
      }
      setCompanyName(json.data.company_name)
      setPositionTitle(json.data.position_title)
      setJobDescription(json.data.job_description)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setParsing(false)
    }
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
      setError(json.error?.message ?? 'Kaydedilemedi.')
      setSaving(false)
      return
    }

    router.push('/board')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Yeni Başvuru</h1>
        <p className="text-sm text-slate-500">
          İş ilanı linkini yapıştır, bilgileri otomatik doldurmayı dene.
        </p>
      </div>

      <Card className="space-y-3">
        <label className="text-sm font-medium text-slate-700">İlan URL&apos;si</label>
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://www.linkedin.com/jobs/view/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button onClick={handleParse} disabled={parsing || !url} variant="secondary">
            {parsing ? <Spinner /> : 'Doldur'}
          </Button>
        </div>
      </Card>

      <form onSubmit={handleSave}>
        <Card className="space-y-4">
          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Şirket Adı</label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Pozisyon</label>
            <Input
              value={positionTitle}
              onChange={(e) => setPositionTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">İlan Açıklaması</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={saving || !companyName || !positionTitle}>
            {saving ? <Spinner /> : 'Kaydet'}
          </Button>
        </Card>
      </form>
    </div>
  )
}
