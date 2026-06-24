'use client'

import { useState } from 'react'
import { Wand2, SpellCheck, Scissors, Copy, Check, Save } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useI18n } from '@/components/i18n/I18nProvider'

type Mode = 'proofread' | 'shorten'

const MODE_META: { id: Mode; icon: React.ElementType }[] = [
  { id: 'proofread', icon: SpellCheck },
  { id: 'shorten', icon: Scissors },
]

export function CvPolishCard({ hasCv }: { hasCv: boolean }) {
  const { t } = useI18n()
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
        setError(json.error?.message ?? t.common.error)
        return
      }
      setResult(json.data.result_text)
      setNotes(json.data.notes ?? [])
    } catch {
      setError(t.common.connectionError)
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
        setError(json.error?.message ?? t.newApp.saveError)
        return
      }
      setSaved(true)
    } catch {
      setError(t.common.connectionError)
    } finally {
      setSaving(false)
    }
  }

  const busy = activeMode !== null

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-amber-500" />
        <h2 className="text-sm font-semibold text-white">{t.cvPolish.title}</h2>
      </div>
      <p className="text-sm text-white/50">
        {t.cvPolish.desc}
      </p>

      {!hasCv ? (
        <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
          {t.cvPolish.noCv}
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {MODE_META.map(({ id, icon: Icon }) => (
            <Button key={id} onClick={() => handleRun(id)} disabled={busy} variant="secondary">
              {activeMode === id ? <Spinner /> : <Icon className="h-4 w-4" />}
              {t.cvPolish[id]}
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
              {copied ? t.common.copied : t.common.copy}
            </Button>
            <Button onClick={handleSave} disabled={saving} variant="primary">
              {saving ? <Spinner /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? t.common.saved : t.cvPolish.saveAsMaster}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
