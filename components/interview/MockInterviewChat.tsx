'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Mic, MicOff, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { InterviewFeedbackReport } from '@/components/interview/InterviewFeedbackReport'
import { MOCK_INTERVIEW_QUESTION_COUNT } from '@/utils/constants'
import { isSpeechSynthesisSupported, speakText, cancelSpeech, type VoiceGender } from '@/lib/speech'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
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

  const [voiceMode, setVoiceMode] = useState(false)
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female')
  const [speechSupported, setSpeechSupported] = useState(false)
  const speech = useSpeechRecognition()
  const prevMessageCountRef = useRef(initialMessages.length)

  useEffect(() => {
    setSpeechSupported(isSpeechSynthesisSupported() && speech.isSupported)
  }, [speech.isSupported])

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const last = messages[messages.length - 1]
      if (voiceMode && last.role === 'interviewer') {
        speakText(last.content, voiceGender)
      }
    }
    prevMessageCountRef.current = messages.length
  }, [messages, voiceMode])

  useEffect(() => {
    if (speech.transcript) {
      setInput(speech.transcript)
    }
  }, [speech.transcript])

  useEffect(() => {
    return () => {
      cancelSpeech()
      speech.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleVoiceMode() {
    if (voiceMode) {
      cancelSpeech()
      speech.stop()
    }
    setVoiceMode((prev) => !prev)
  }

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
          <div className="flex items-center gap-2">
            {speechSupported && voiceMode && (
              <div className="flex overflow-hidden rounded-md border border-slate-200 text-xs">
                <button
                  onClick={() => setVoiceGender('female')}
                  className={`px-2 py-1 ${voiceGender === 'female' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  ♀ Kadın
                </button>
                <button
                  onClick={() => setVoiceGender('male')}
                  className={`px-2 py-1 ${voiceGender === 'male' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  ♂ Erkek
                </button>
              </div>
            )}
            {speechSupported && (
              <Button
                onClick={toggleVoiceMode}
                variant="ghost"
                title={voiceMode ? 'Sesli modu kapat' : 'Sesli modu aç'}
              >
                {voiceMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
            )}
            <span className="text-xs text-slate-500">
              {status === 'completed'
                ? 'Tamamlandı'
                : `Soru ${Math.min(questionCount, MOCK_INTERVIEW_QUESTION_COUNT)} / ${MOCK_INTERVIEW_QUESTION_COUNT}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-1">
              <p className="text-xs font-medium text-slate-400">
                {message.role === 'interviewer' ? 'Mülakatçı' : 'Sen'}
              </p>
              {message.role === 'interviewer' && speechSupported && (
                <button
                  onClick={() => speakText(message.content, voiceGender)}
                  title="Sesli oku"
                  className="text-slate-300 hover:text-slate-500"
                >
                  <Volume2 className="h-3 w-3" />
                </button>
              )}
            </div>
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
            placeholder={speech.isListening ? 'Dinleniyor...' : 'Cevabını yaz...'}
            disabled={loading}
          />
          {voiceMode && (
            <Button
              onClick={() => (speech.isListening ? speech.stop() : speech.start())}
              disabled={loading}
              variant={speech.isListening ? 'secondary' : 'ghost'}
              title={speech.isListening ? 'Dinlemeyi durdur' : 'Sesle cevapla'}
            >
              {speech.isListening ? (
                <Mic className="h-4 w-4 animate-pulse text-red-500" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
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
