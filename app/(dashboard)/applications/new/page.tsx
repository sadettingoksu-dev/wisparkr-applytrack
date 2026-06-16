'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Lock } from 'lucide-react'
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
  const [limitReached, setLimitReached] = useState(false)
  const [limitInfo, setLimitInfo] = useState<{ used: number; max: number } | null>(null)

  // Sayfa açılırken limit kontrolü yap
  useEffect(() => {
    fetch('/api/applications/limit')
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          setLimitInfo({ used: json.data.used, max: json.data.max })
          if (json.data.reached) setLimitReached(true)
        }
      })
      .catch(() => {})
  }, [])

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
      if (json.error?.code === 'PLAN_LIMIT_EXCEEDED') {
        setLimitReached(true)
      } else {
        setError(json.error?.message ?? 'Kaydedilemedi.')
      }
      setSaving(false)
      return
    }

    router.push('/board')
  }

  if (limitReached) {
    return (
      <div className="mx-auto max-w-md pt-12 text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100">
            <Lock className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">Başvuru limitine ulaştın</h1>
          <p className="text-slate-500">
            Ücretsiz planda en fazla <strong>{limitInfo?.max ?? 2} başvuru</strong> ekleyebilirsin.
            {limitInfo && ` (${limitInfo.used}/${limitInfo.max} kullanıldı)`}
          </p>
        </div>

        <Card className="text-left space-y-3">
          <p className="text-sm font-semibold text-slate-700">Pro plana geçerek:</p>
          <ul className="space-y-2 text-sm text-slate-600">
            {[
              'Sınırsız başvuru ekle',
              '200 AI sorusu/ay kullan',
              'CV otomatik optimizasyonu al',
              'Mock mülakat provası yap',
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <div className="pt-1 flex flex-col gap-2">
            <Link href="/pricing">
              <Button className="w-full">
                <Zap className="h-4 w-4" />
                Planları Gör ve Yükselt
              </Button>
            </Link>
            <Link href="/applications" className="text-center text-sm text-slate-400 hover:text-slate-600">
              Mevcut başvurularıma dön
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Yeni Başvuru</h1>
          <p className="text-sm text-slate-500">
            İş ilanı linkini yapıştır, bilgileri otomatik doldurmayı dene.
          </p>
        </div>
        {limitInfo && limitInfo.max !== null && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            {limitInfo.used}/{limitInfo.max} başvuru
          </span>
        )}
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
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Pozisyon</label>
            <Input value={positionTitle} onChange={(e) => setPositionTitle(e.target.value)} required />
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
