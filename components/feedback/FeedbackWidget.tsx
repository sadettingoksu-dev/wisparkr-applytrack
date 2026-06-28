'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, CheckCircle2 } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'

type Category = 'bug' | 'idea' | 'other'

export function FeedbackWidget() {
  const { t } = useI18n()
  const f = t.feedback
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<Category>('idea')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (message.trim().length < 2 || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), category, page: pathname }),
      })
      if (!res.ok) {
        setError(f.error)
        setSending(false)
        return
      }
      setSent(true)
      setMessage('')
    } catch {
      setError(f.error)
    } finally {
      setSending(false)
    }
  }

  function reset() {
    setOpen(false)
    setTimeout(() => {
      setSent(false)
      setError(null)
    }, 200)
  }

  const cats: { id: Category; label: string }[] = [
    { id: 'bug', label: f.categoryBug },
    { id: 'idea', label: f.categoryIdea },
    { id: 'other', label: f.categoryOther },
  ]

  return (
    <>
      {/* yüzen buton */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-400/40 transition-transform hover:scale-105"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">{f.button}</span>
        </button>
      )}

      {/* panel */}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[calc(100vw-2.5rem)] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
              <p className="text-xs text-slate-500">{f.desc}</p>
            </div>
            <button onClick={reset} aria-label={f.close} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-sm text-slate-600">{f.thanks}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-1.5">
                {cats.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                      category === c.id
                        ? 'border-purple-400 bg-purple-50 text-purple-700'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={f.placeholder}
                rows={4}
                maxLength={2000}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
              />

              {error && <p className="text-xs text-red-500">{error}</p>}

              <button
                onClick={handleSend}
                disabled={sending || message.trim().length < 2}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {sending ? f.sending : f.send}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
