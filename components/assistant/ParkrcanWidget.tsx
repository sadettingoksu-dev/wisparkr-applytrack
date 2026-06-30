'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { Send, X } from 'lucide-react'
import clsx from 'clsx'

/**
 * parkrcan — uygulama içi yapay zeka rehberi. Sağ altta, FeedbackWidget'in
 * üstünde yüzen karikatürlü buton. Kullanıcı ne yapmak istediğini yazar;
 * /api/ai/assistant kısa bir yanıt + ilgili sayfa link(ler)i döndürür ve
 * kullanıcı linke tıklayıp doğrudan o sayfaya gider.
 *
 * NOT: Arayüz metinleri şimdilik Türkçe sabit (asistan yanıtları da Türkçe).
 * Çok dilli (i18n) hale getirme sonraki iyileştirmede yapılabilir.
 */

type AssistantLink = { label: string; href: string }
type Message = { role: 'user' | 'assistant'; text: string; links?: AssistantLink[] }

const GREETING =
  'Merhaba! Ben parkrcan 👋 Ne yapmak istediğini yaz, seni doğru yere götüreyim.'

export function ParkrcanWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', text: GREETING }])
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollToBottom() {
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    })
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text }])
    setLoading(true)
    scrollToBottom()
    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: 'assistant', text: json.error?.message ?? 'Bir şeyler ters gitti, tekrar dener misin?' },
        ])
      } else {
        setMessages((m) => [
          ...m,
          { role: 'assistant', text: json.data.reply as string, links: json.data.links as AssistantLink[] },
        ])
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: 'Bağlantı hatası, tekrar dener misin?' }])
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  return (
    <>
      {/* Yüzen buton — FeedbackWidget'in (sağ-alt) üstünde */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="parkrcan'ı aç"
          className="fixed bottom-24 right-5 z-40 h-16 w-16 overflow-hidden rounded-full bg-white shadow-lg shadow-purple-400/40 ring-2 ring-purple-200 transition-transform hover:scale-105"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/parkrcan.png" alt="parkrcan" className="h-full w-full object-cover" />
        </button>
      )}

      {/* Sohbet paneli */}
      {open && (
        <div className="fixed bottom-24 right-5 z-40 flex h-[28rem] max-h-[calc(100vh-8rem)] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          {/* Başlık */}
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-3 text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/parkrcan.png" alt="" className="h-9 w-9 rounded-full bg-white object-cover" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">parkrcan</p>
              <p className="truncate text-[11px] text-white/80">Sana yol göstereyim</p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Kapat" className="text-white/80 transition-colors hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mesajlar */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={clsx(
                    'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                    m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white text-slate-700 shadow-sm'
                  )}
                >
                  <p className="whitespace-pre-line">{m.text}</p>
                  {m.links && m.links.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.links.map((l, j) => (
                        <Link
                          key={j}
                          href={l.href}
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-200"
                        >
                          {l.label} →
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-400 shadow-sm">parkrcan yazıyor…</div>
              </div>
            )}
          </div>

          {/* Girdi */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            className="flex items-center gap-2 border-t border-slate-200 bg-white p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ne yapmak istiyorsun?"
              className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Gönder"
              className="rounded-lg bg-purple-600 p-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
