'use client'

import { useState } from 'react'
import { Wand2, Languages, SpellCheck, Scissors, Copy, Check, Save } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

type Mode = 'translate_en' | 'translate_tr' | 'proofread' | 'shorten'

const MODES: { id: Mode; label: string; icon: React.ElementType }[] = [
  { id: 'translate_en', label: 'İngilizceye çevir', icon: Languages },
  { id: 'translate_tr', label: 'Türkçeye çevir', icon: Languages },
  { id: 'proofread', label: 'Dil & yazım düzelt', icon: SpellCheck },
  { id: 'shorten', label: 'Kısalt (tek sayfa)', icon: Scissors },
]

export function CvPolishCard({ hasCv }: { hasCv: boolean }) {
  const [result, setResult] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [activeMode, setActiveMode] = useState<Mode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleRun(mode: Mode) {
    setActiveMode(mode)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/ai/polish-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      setResult(json.data.result_text)
      setNotes(json.data.notes ?? [])
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setActiveMode(null)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/cv/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: result }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Kaydedilemedi.')
        return
      }
      setSaved(true)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setSaving(false)
    }
  }

  const busy = activeMode !== null

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-white">AI CV Cila Araçları</h2>
      </div>
      <p className="text-sm text-white/50">
        Master CV&apos;ni tek tıkla başka dile çevir, dil/yazım hatalarını düzelt ya da tek
        sayfaya sığacak şekilde kısalt. Sonucu düzenleyip kopyalayabilir veya master CV olarak
        kaydedebilirsin.
      </p>

      {!hasCv ? (
        <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
          Önce yukarıdan bir CV yükle; araçlar yüklenen CV üzerinde çalışır.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {MODES.map(({ id, label, icon: Icon }) => (
            <Button key={id} onClick={() => handleRun(id)} disabled={busy} variant="secondary">
              {activeMode === id ? <Spinner /> : <Icon className="h-4 w-4" />}
              {label}
            </Button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {result && (
        <div className="space-y-3">
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={12}
            className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-relaxed text-white/90 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          {notes.length > 0 && (
            <ul className="space-y-1">
              {notes.map((n, i) => (
                <li key={i} className="flex gap-2 text-xs text-white/50">
                  <span className="text-amber-500">•</span>
                  {n}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleCopy} variant="secondary">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Kopyalandı' : 'Kopyala'}
            </Button>
            <Button onClick={handleSave} disabled={saving} variant="primary">
              {saving ? <Spinner /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Kaydedildi' : 'Master CV olarak kaydet'}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
