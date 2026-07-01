'use client'

import { useState } from 'react'
import { FileSignature, Sparkles, Copy, Check, Download } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { TemplatePicker, type CvTemplate } from '@/components/cv/TemplatePicker'
import { useI18n } from '@/components/i18n/I18nProvider'

interface CoverLetterCardProps {
  applicationId: string
  initialText?: string | null
}

const TONE_IDS = ['professional', 'enthusiastic', 'concise'] as const

type Tone = (typeof TONE_IDS)[number]

export function CoverLetterCard({ applicationId, initialText }: CoverLetterCardProps) {
  const { t } = useI18n()
  const [text, setText] = useState(initialText ?? '')
  const [tone, setTone] = useState<Tone>('professional')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [template, setTemplate] = useState<CvTemplate>('vitrin')
  // The PDF is rendered from the saved (last generated) version on the server.
  const [savedText, setSavedText] = useState(initialText ?? '')

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
        setError(json.error?.message ?? t.common.error)
        return
      }
      setText(json.data.cover_letter)
      setSavedText(json.data.cover_letter)
    } catch {
      setError(t.common.connectionError)
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
        <FileSignature className="h-4 w-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-slate-900">{t.coverLetter.title}</h3>
      </div>
      <p className="text-sm text-slate-500">
        {t.coverLetter.desc}
      </p>

      <div className="flex flex-wrap gap-2">
        {TONE_IDS.map((id) => (
          <button
            key={id}
            onClick={() => setTone(id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              tone === id
                ? 'bg-purple-100 text-purple-700'
                : 'bg-white text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.coverLetter.tones[id]}
          </button>
        ))}
      </div>

      {text && (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
        />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      {savedText && <TemplatePicker value={template} onChange={setTemplate} />}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleGenerate} disabled={loading} variant="secondary">
          {loading ? (
            <Spinner />
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {text ? t.coverLetter.regenerate : t.coverLetter.generate}
            </>
          )}
        </Button>
        {text && (
          <Button onClick={handleCopy} variant="secondary">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t.common.copied : t.common.copy}
          </Button>
        )}
        {savedText && (
          <a href={`/api/applications/${applicationId}/cv-pdf?type=cover_letter&template=${template}`}>
            <Button variant="primary">
              <Download className="h-4 w-4" />
              {t.coverLetter.downloadPdf}
            </Button>
          </a>
        )}
      </div>

      {savedText && text !== savedText && (
        <p className="text-xs text-purple-600/80">
          {t.coverLetter.staleNote}
        </p>
      )}
    </Card>
  )
}
