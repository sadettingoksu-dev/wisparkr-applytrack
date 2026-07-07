'use client'

import { useEffect, useState } from 'react'
import { Share2, Copy, Check, Trash2, Link2, Crown, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { UpgradeButton } from '@/components/billing/UpgradeButton'
import { isShareActive } from '@/lib/cv'
import { useI18n } from '@/components/i18n/I18nProvider'
import { format } from '@/lib/i18n'

const inputClass =
  'flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200'

interface Share {
  id: string
  token: string
  label: string | null
  url: string
  expires_at: string | null
  revoked: boolean
  view_count: number
  created_at: string
}

export function SharePanel({ plan }: { plan: string }) {
  const { t } = useI18n()
  const isPaid = plan !== 'free'
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)
  const [label, setLabel] = useState('')
  const [slug, setSlug] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/cv/share')
      .then((r) => r.json())
      .then((j) => setShares(j.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    setCreating(true)
    setError(null)
    try {
      const res = await fetch('/api/cv/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label || undefined, slug: isPaid && slug ? slug : undefined }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.share.createError)
        return
      }
      setShares((p) => [json.data, ...p])
      setLabel('')
      setSlug('')
    } catch {
      setError(t.common.connectionError)
    } finally {
      setCreating(false)
    }
  }

  async function copy(s: Share) {
    await navigator.clipboard.writeText(s.url)
    setCopiedId(s.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  async function remove(id: string) {
    await fetch(`/api/cv/share/${id}`, { method: 'DELETE' })
    setShares((p) => p.filter((x) => x.id !== id))
  }

  function daysLeft(expires: string | null): number | null {
    if (!expires) return null
    return Math.max(0, Math.ceil((new Date(expires).getTime() - Date.now()) / 86400_000))
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-purple-600" />
        <h2 className="text-sm font-semibold text-slate-900">{t.share.title}</h2>
      </div>
      <p className="text-sm text-slate-500">
        {t.share.descMain}
        {isPaid && ` ${t.share.descPaid} ${t.share.descSave}`}
      </p>

      {isPaid ? (
        <>
          <div className="flex flex-wrap gap-2">
            <input className={inputClass} placeholder={t.share.labelPlaceholder} value={label} onChange={(e) => setLabel(e.target.value)} />
            <input
              className={`${inputClass} max-w-[180px]`}
              placeholder={t.share.slugPlaceholder}
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
            />
            <Button onClick={handleCreate} disabled={creating} variant="primary">
              {creating ? (
                <Spinner />
              ) : (
                <>
                  <Link2 className="h-4 w-4" />
                  {t.share.create}
                </>
              )}
            </Button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </>
      ) : (
        <div className="flex flex-col gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 text-xs text-purple-700">
            <Crown className="h-4 w-4 shrink-0" />
            {t.share.proOnly}
          </p>
          <div className="shrink-0">
            <UpgradeButton planId="pro" label={t.share.makePermanent} />
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-xs text-slate-400">{t.share.loading}</p>
      ) : shares.length === 0 ? (
        <p className="text-xs text-slate-400">{t.share.noShares}</p>
      ) : (
        <div className="space-y-2">
          {shares.map((s) => {
            const active = isShareActive(s, plan)
            const left = daysLeft(s.expires_at)
            return (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-900">{s.label || t.share.untitled}</p>
                    <p className="truncate text-xs text-slate-400">{s.url}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => copy(s)} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
                      {copiedId === s.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button onClick={() => remove(s.id)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                    {s.revoked ? t.share.revoked : active ? t.share.active : t.share.inactive}
                  </span>
                  {isPaid && (
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <Eye className="h-3 w-3" />
                      {s.view_count} {t.share.viewsSuffix}
                    </span>
                  )}
                  {!isPaid && active && left !== null && <span className="text-purple-700/80">{format(t.share.daysLeft, { n: left })}</span>}
                  {!isPaid && !active && !s.revoked && (
                    <a href="/pricing" className="inline-flex items-center gap-1 text-purple-600 hover:underline">
                      <Crown className="h-3 w-3" />
                      {t.share.makePermanent}
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
