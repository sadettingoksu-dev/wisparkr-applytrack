'use client'

import { useState } from 'react'
import { FileSignature, Sparkles, Copy, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

interface CoverLetterCardProps {
  applicationId: string
  initialText?: string | null
}

const TONES = [
  { id: 'professional', label: 'Profesyonel' },
  { id: 'enthusiastic', label: 'İstekli' },
  { id: 'concise', label: 'Kısa & öz' },
] as const

type Tone = (typeof TONES)[number]['id']

export function CoverLetterCard({ applicationId, initialText }: CoverLetterCardProps) {
  const [text, setText] = useState(initialText ?? '')
  const [tone, setTone] = useState<Tone>('professional')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, tone }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      setText(json.data.cover_letter)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <FileSignature className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-white">AI Ön Yazı</h3>
      </div>
      <p className="text-sm text-white/50">
        AI, CV&apos;ni ve bu ilanı kullanarak başvuruna özel bir ön yazı (niyet mektubu)
        yazar. Üslubu seç, oluştur, düzenle ve kopyala.
      </p>

      <div className="flex flex-wrap gap-2">
        {TONES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTone(t.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tone === t.id
                ? 'bg-amber-500/15 text-amber-300'
                : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {text && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm leading-relaxed text-white/90 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleGenerate} disabled={loading} variant="secondary">
          {loading ? (
            <Spinner />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {text ? 'Yeniden Oluştur' : 'Ön Yazı Oluştur'}
            </>
          )}
        </Button>
        {text && (
          <Button onClick={handleCopy} variant="secondary">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Kopyalandı' : 'Kopyala'}
          </Button>
        )}
      </div>
    </Card>
  )
}
