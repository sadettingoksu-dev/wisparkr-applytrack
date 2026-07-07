'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, Copy, Check } from 'lucide-react'
import { Markdown } from '@/components/chat/Markdown'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { AiMessage } from '@/lib/types'

interface AIChatPanelProps {
  applicationId: string
  initialMessages: AiMessage[]
}

export function AIChatPanel({ applicationId, initialMessages }: AIChatPanelProps) {
  const { t } = useI18n()
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Yeni mesaj / yükleme durumunda en alta kaydır.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // Textarea otomatik yükseklik.
  function autosize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  async function sendMessage(content: string) {
    if (!content.trim() || loading) return
    setError(null)
    setLoading(true)

    const userMessage: Partial<AiMessage> = { role: 'user', content }
    setMessages((prev) => [...prev, userMessage as AiMessage])
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, message: content }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.common.error)
        return
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: json.data.reply } as AiMessage])
    } catch {
      setError(t.common.connectionError)
    } finally {
      setLoading(false)
    }
  }

  async function copyMessage(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex((c) => (c === index ? null : c)), 1500)
    } catch {
      /* pano erişilemezse sessizce geç */
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Başlık */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{t.chat.title}</h3>
          <p className="truncate text-xs text-slate-500">{t.chat.desc}</p>
        </div>
      </div>

      {/* Mesajlar */}
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {messages.length === 0 && !loading && (
          <div className="mx-auto max-w-lg space-y-4 py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <Sparkles className="h-7 w-7" />
            </div>
            <p className="text-sm text-slate-500">{t.chat.emptyHint}</p>
            <div className="space-y-2">
              {t.chat.suggested.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendMessage(q)}
                  disabled={loading}
                  className="block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-left text-sm text-slate-600 transition hover:border-purple-200 hover:bg-purple-50/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, i) =>
          message.role === 'user' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-purple-600 px-4 py-2.5 text-sm text-white">
                {message.content}
              </div>
            </div>
          ) : (
            <div key={i} className="group flex gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3 text-sm text-slate-800">
                  <Markdown content={message.content} />
                </div>
                <button
                  type="button"
                  onClick={() => copyMessage(message.content, i)}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400 opacity-0 transition hover:text-purple-600 group-hover:opacity-100"
                >
                  {copiedIndex === i ? (
                    <>
                      <Check className="h-3 w-3" />
                      {t.chat.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      {t.chat.copy}
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-slate-50 px-4 py-3">
              <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300 [animation-delay:-0.3s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300 [animation-delay:-0.15s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300" />
              <span className="ml-2 text-xs text-slate-400">{t.chat.thinking}</span>
            </div>
          </div>
        )}
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-500">{error}</p>}

      {/* Girdi */}
      <div className="border-t border-slate-200 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 focus-within:border-purple-300">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              autosize()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            rows={1}
            placeholder={t.chat.placeholder}
            disabled={loading}
            className="max-h-40 flex-1 resize-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
