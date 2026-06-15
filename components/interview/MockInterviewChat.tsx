'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { InterviewFeedbackReport } from '@/components/interview/InterviewFeedbackReport'
import { MOCK_INTERVIEW_QUESTION_COUNT } from '@/utils/constants'
import type { MockInterview, MockInterviewMessage, MockInterviewFeedback } from '@/lib/types'

interface MockInterviewChatProps {
  interview: MockInterview
  initialMessages: MockInterviewMessage[]
}

export function MockInterviewChat({ interview, initialMessages }: MockInterviewChatProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState(interview.status)
  const [questionCount, setQuestionCount] = useState(interview.question_count)
  const [feedback, setFeedback] = useState<MockInterviewFeedback | null>(
    interview.feedback as MockInterviewFeedback | null
  )
  const [overallScore, setOverallScore] = useState<number | null>(interview.overall_score)
  const [retrying, setRetrying] = useState(false)

  async function sendMessage() {
    const content = input.trim()
    if (!content || loading) return
    setError(null)
    setLoading(true)
    setInput('')

    const optimisticMessage: Partial<MockInterviewMessage> = {
      role: 'candidate',
      content,
    }
    setMessages((prev) => [...prev, optimisticMessage as MockInterviewMessage])

    try {
      const res = await fetch(`/api/mock-interview/${interview.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'Bir hata oluştu.')
        setMessages((prev) => prev.slice(0, -1))
        setInput(content)
        return
      }

      setMessages((prev) => [
        ...prev,
        { role: 'interviewer', content: json.data.message } as MockInterviewMessage,
      ])

      if (json.data.is_final) {
        setStatus('completed')
        if (json.data.feedback) {
          setFeedback(json.data.feedback)
          setOverallScore(json.data.overall_score)
        }
      } else {
        setQuestionCount((prev) => prev + 1)
      }
    } catch {
      setError('Bağlantı hatası.')
      setMessages((prev) => prev.slice(0, -1))
      setInput(content)
    } finally {
      setLoading(false)
    }
  }

  async function finishInterview() {
    if (!window.confirm('Mülakatı şimdi bitirmek istediğine emin misin?')) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/mock-interview/${interview.id}/finish`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      setStatus('completed')
      setFeedback(json.data.feedback)
      setOverallScore(json.data.overall_score)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setLoading(false)
    }
  }

  async function retryFeedback() {
    setError(null)
    setRetrying(true)
    try {
      const res = await fetch(`/api/mock-interview/${interview.id}/retry-feedback`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? 'Bir hata oluştu.')
        return
      }
      setFeedback(json.data.feedback)
      setOverallScore(json.data.overall_score)
    } catch {
      setError('Bağlantı hatası.')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-100 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Mock Mülakat</h3>
          <span className="text-xs text-slate-500">
            {status === 'completed'
              ? 'Tamamlandı'
              : `Soru ${Math.min(questionCount, MOCK_INTERVIEW_QUESTION_COUNT)} / ${MOCK_INTERVIEW_QUESTION_COUNT}`}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, i) => (
          <div key={i} className="space-y-1">
            <p className="text-xs font-medium text-slate-400">
              {message.role === 'interviewer' ? 'Mülakatçı' : 'Sen'}
            </p>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                message.role === 'candidate'
                  ? 'ml-auto bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && <Spinner />}

        {status === 'completed' && (
          <div className="pt-2">
            {feedback ? (
              <InterviewFeedbackReport feedback={feedback} overallScore={overallScore ?? 0} />
            ) : (
              <div className="space-y-2 rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                <p>Geri bildirim raporu oluşturulamadı.</p>
                <Button onClick={retryFeedback} disabled={retrying} variant="secondary">
                  {retrying ? <Spinner /> : 'Tekrar Dene'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-500">{error}</p>}

      {status === 'in_progress' && (
        <div className="flex gap-2 border-t border-slate-100 p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Cevabını yaz..."
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
          <Button onClick={finishInterview} disabled={loading} variant="ghost">
            Mülakatı Bitir
          </Button>
        </div>
      )}
    </div>
  )
}
