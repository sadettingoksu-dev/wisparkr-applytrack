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
import { useI18n } from '@/components/i18n/I18nProvider'
import { format } from '@/lib/i18n'
import type { MockInterview, MockInterviewMessage, MockInterviewFeedback } from '@/lib/types'

interface MockInterviewChatProps {
  interview: MockInterview
  initialMessages: MockInterviewMessage[]
}

export function MockInterviewChat({ interview, initialMessages }: MockInterviewChatProps) {
  const { t } = useI18n()
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
        setError(json.error?.message ?? t.common.error)
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
      setError(t.common.connectionError)
      setMessages((prev) => prev.slice(0, -1))
      setInput(content)
    } finally {
      setLoading(false)
    }
  }

  async function finishInterview() {
    if (!window.confirm(t.interview.finishConfirm)) return
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/mock-interview/${interview.id}/finish`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error?.message ?? t.common.error)
        return
      }
      setStatus('completed')
      setFeedback(json.data.feedback)
      setOverallScore(json.data.overall_score)
    } catch {
      setError(t.common.connectionError)
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
        setError(json.error?.message ?? t.common.error)
        return
      }
      setFeedback(json.data.feedback)
      setOverallScore(json.data.overall_score)
    } catch {
      setError(t.common.connectionError)
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">{t.interview.chatTitle}</h3>
          <div className="flex items-center gap-2">
            {speechSupported && voiceMode && (
              <div className="flex overflow-hidden rounded-md border border-slate-200 text-xs">
                <button
                  onClick={() => setVoiceGender('female')}
                  className={`px-2 py-1 ${voiceGender === 'female' ? 'bg-purple-600 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {t.interview.voiceFemale}
                </button>
                <button
                  onClick={() => setVoiceGender('male')}
                  className={`px-2 py-1 ${voiceGender === 'male' ? 'bg-purple-600 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                  {t.interview.voiceMale}
                </button>
              </div>
            )}
            {speechSupported && (
              <div className="relative group">
                <Button
                  onClick={toggleVoiceMode}
                  variant="ghost"
                  title={voiceMode ? t.interview.voiceOffTitle : t.interview.voiceOnTitle}
                >
                  {voiceMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <div className="pointer-events-none absolute right-0 top-full mt-2 z-50 w-56 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-900 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {voiceMode ? t.interview.voiceTipOn : t.interview.voiceTipOff}
                  <div className="absolute -top-1.5 right-3 h-3 w-3 rotate-45 bg-slate-800" />
                </div>
              </div>
            )}
            <span className="text-xs text-slate-500">
              {status === 'completed'
                ? t.interview.completed
                : format(t.interview.questionProgress, { n: Math.min(questionCount, MOCK_INTERVIEW_QUESTION_COUNT), total: MOCK_INTERVIEW_QUESTION_COUNT })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-1">
              <p className="text-xs font-medium text-slate-400">
                {message.role === 'interviewer' ? t.interview.interviewer : t.interview.you}
              </p>
              {message.role === 'interviewer' && speechSupported && (
                <button
                  onClick={() => speakText(message.content, voiceGender)}
                  title={t.interview.readAloud}
                  className="text-slate-400 hover:text-slate-500"
                >
                  <Volume2 className="h-3 w-3" />
                </button>
              )}
            </div>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                message.role === 'candidate'
                  ? 'ml-auto bg-purple-600 text-slate-900'
                  : 'bg-slate-100 text-slate-900'
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
              <div className="space-y-2 rounded-lg border border-purple-500/20 bg-purple-50 p-4 text-sm text-purple-700">
                <p>{t.interview.feedbackFailed}</p>
                <Button onClick={retryFeedback} disabled={retrying} variant="secondary">
                  {retrying ? <Spinner /> : t.interview.retry}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="px-4 pb-2 text-xs text-red-500">{error}</p>}

      {status === 'in_progress' && (
        <div className="flex gap-2 border-t border-slate-200 p-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={speech.isListening ? t.interview.listening : t.interview.answerPlaceholder}
            disabled={loading}
          />
          {voiceMode && (
            <Button
              onClick={() => (speech.isListening ? speech.stop() : speech.start())}
              disabled={loading}
              variant={speech.isListening ? 'secondary' : 'ghost'}
              title={speech.isListening ? t.interview.stopListening : t.interview.answerByVoice}
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
            {t.interview.finish}
          </Button>
        </div>
      )}
    </div>
  )
}
