'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import type { AiMessage } from '@/lib/types'

interface AIChatPanelProps {
  applicationId: string
  initialMessages: AiMessage[]
}

export function AIChatPanel({ applicationId, initialMessages }: AIChatPanelProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!input.trim()) return
    setError(null)
    setLoading(true)

    const userMessage: Partial<AiMessage> = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage as AiMessage])
    setInput('')

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, message: input }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: json.data.reply } as AiMessage,
      ])
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-100 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">Mülakat Hazırlık Asistanı</h3>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Bu şirket ve pozisyon için mülakat hazırlık soruları sorabilirsiniz.
          </p>
        )}
        {messages.map((message, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              message.role === 'user'
                ? 'ml-auto bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            {message.content}
          </div>
        ))}
        {loading && <Spinner />}
      </div>
      {error && <p className="px-4 pb-2 text-xs text-red-500">{error}</p>}
      <div className="flex gap-2 border-t border-slate-100 p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Bir soru sor..."
          disabled={loading}
        />
        <Button onClick={handleSend} disabled={loading}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
