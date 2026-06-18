'use client'

import { useEffect, useState } from 'react'
import { Share2, Copy, Check, Trash2, Link2, Crown, Eye } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { isShareActive, SHARE_FREE_TTL_DAYS } from '@/lib/cv'

const inputClass =
  'flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30'

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
        setError(json.error?.message ?? 'Link oluşturulamadı.')
        return
      }
      setShares((p) => [json.data, ...p])
      setLabel('')
      setSlug('')
    } catch {
      setError('Bağlantı hatası.')
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
        <Share2 className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-white">Paylaşılabilir CV Linki</h2>
      </div>
      <p className="text-sm text-white/50">
        CV&apos;ni link olarak paylaş (LinkedIn DM, e-posta, mesaj — dosya ekleyemediğin her yer).{' '}
        {isPaid
          ? 'Linklerin kalıcı ve görüntülenme sayısını görürsün.'
          : `Ücretsiz linkler ${SHARE_FREE_TTL_DAYS} gün sonra pasifleşir — Pro ile kalıcı yap.`}{' '}
        Linki oluşturmadan önce CV&apos;ni <strong>kaydet</strong>.
      </p>

      <div className="flex flex-wrap gap-2">
        <input className={inputClass} placeholder="Etiket (örn. Google başvurusu)" value={label} onChange={(e) => setLabel(e.target.value)} />
        {isPaid && (
          <input
            className={`${inputClass} max-w-[180px]`}
            placeholder="özel-link-adı (ops.)"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
          />
        )}
        <Button onClick={handleCreate} disabled={creating} variant="primary">
          {creating ? (
            <Spinner />
          ) : (
            <>
              <Link2 className="h-4 w-4" />
              Link Oluştur
            </>
          )}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}

      {loading ? (
        <p className="text-xs text-white/40">Yükleniyor...</p>
      ) : shares.length === 0 ? (
        <p className="text-xs text-white/40">Henüz paylaşım linkin yok.</p>
      ) : (
        <div className="space-y-2">
          {shares.map((s) => {
            const active = isShareActive(s, plan)
            const left = daysLeft(s.expires_at)
            return (
              <div key={s.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{s.label || 'Etiketsiz'}</p>
                    <p className="truncate text-xs text-white/40">{s.url}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => copy(s)} className="rounded p-1.5 text-white/50 hover:bg-white/5 hover:text-white">
                      {copiedId === s.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button onClick={() => remove(s.id)} className="rounded p-1.5 text-white/40 hover:bg-white/5 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 ${active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'}`}>
                    {s.revoked ? 'İptal edildi' : active ? 'Aktif' : 'Pasif'}
                  </span>
                  {isPaid && (
                    <span className="inline-flex items-center gap-1 text-white/40">
                      <Eye className="h-3 w-3" />
                      {s.view_count} görüntülenme
                    </span>
                  )}
                  {!isPaid && active && left !== null && <span className="text-amber-300/80">{left} gün kaldı</span>}
                  {!isPaid && !active && !s.revoked && (
                    <a href="/pricing" className="inline-flex items-center gap-1 text-amber-400 hover:underline">
                      <Crown className="h-3 w-3" />
                      Pro ile kalıcı yap
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
