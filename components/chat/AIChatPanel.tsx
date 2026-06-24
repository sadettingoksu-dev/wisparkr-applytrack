'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
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

  async function sendMessage(content: string) {
    if (!content.trim()) return
    setError(null)
    setLoading(true)

    const userMessage: Partial<AiMessage> = { role: 'user', content }
    setMessages((prev) => [...prev, userMessage as AiMessage])
    setInput('')

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

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: json.data.reply } as AiMessage,
      ])
    } catch {
      setError(t.common.connectionError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-white/10 bg-white/5">
      <div className="border-b border-white/10 px-4 py-3">
        <h3 className="text-sm font-semibold text-white">{t.chat.title}</h3>
        <p className="text-xs text-white/50">
          {t.chat.desc}
        </p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-white/40">
              {t.chat.emptyHint}
            </p>
            {t.chat.suggested.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendMessage(q)}
                disabled={loading}
                className="block w-full rounded-lg border border-white/10 px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {messages.map((message, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
              message.role === 'user'
                ? 'ml-auto bg-amber-500 text-white'
                : 'bg-white/10 text-white'
            }`}
          >
            {message.content}
          </div>
        ))}
        {loading && <Spinner />}
      </div>
      {error && <p className="px-4 pb-2 text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 border-t border-white/10 p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder={t.chat.placeholder}
          disabled={loading}
        />
        <Button onClick={() => sendMessage(input)} disabled={loading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
