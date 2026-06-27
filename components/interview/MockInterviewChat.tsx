'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Mic, MicOff, Volume2, Bot, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { InterviewFeedbackReport } from '@/components/interview/InterviewFeedbackReport'
import { MOCK_INTERVIEW_QUESTION_COUNT } from '@/utils/constants'
import { isSpeechSynthesisSupported, speakText, cancelSpeech, type VoiceGender } from '@/lib/speech'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { MockInterview, MockInterviewMessage, MockInterviewFeedback } from '@/lib/types'

interface MockInterviewChatProps {
  interview: MockInterview
  initialMessages: MockInterviewMessage[]
  jobTitle: string
  company: string
}

// Sahne animasyonları (handoff tasarımından uyarlandı).
const KEYFRAMES = `
@keyframes mi-eqbar{0%,100%{transform:scaleY(0.22)}50%{transform:scaleY(1)}}
@keyframes mi-pulsering{0%{transform:scale(1);opacity:0.5}100%{transform:scale(1.8);opacity:0}}
@keyframes mi-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes mi-glow{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.12)}}
@keyframes mi-userwave{0%,100%{transform:scaleY(0.3)}50%{transform:scaleY(1)}}
`

const MOUTH_BARS = [
  { dur: '0.5s', delay: '0s' }, { dur: '0.34s', delay: '0.12s' }, { dur: '0.42s', delay: '0.05s' },
  { dur: '0.3s', delay: '0.18s' }, { dur: '0.46s', delay: '0.09s' }, { dur: '0.36s', delay: '0.2s' },
  { dur: '0.4s', delay: '0.04s' },
]
const USER_BARS = [
  { dur: '0.6s', delay: '0s' }, { dur: '0.4s', delay: '0.1s' }, { dur: '0.7s', delay: '0.05s' },
  { dur: '0.5s', delay: '0.18s' }, { dur: '0.38s', delay: '0.12s' }, { dur: '0.62s', delay: '0.03s' },
  { dur: '0.46s', delay: '0.15s' }, { dur: '0.54s', delay: '0.08s' }, { dur: '0.42s', delay: '0.2s' },
]

const STAGE_BG =
  'radial-gradient(120% 120% at 50% 18%, #2a1458 0%, #18103a 38%, #0d0820 72%, #070411 100%)'

export function MockInterviewChat({ interview, initialMessages, jobTitle, company }: MockInterviewChatProps) {
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
  const [elapsed, setElapsed] = useState(0)
  const [showTranscript, setShowTranscript] = useState(false)

  const [voiceMode, setVoiceMode] = useState(false)
  const [voiceGender, setVoiceGender] = useState<VoiceGender>('female')
  const [speechSupported, setSpeechSupported] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speech = useSpeechRecognition()
  const prevMessageCountRef = useRef(initialMessages.length)

  function speak(text: string) {
    if (!isSpeechSynthesisSupported()) return
    setIsSpeaking(true)
    speakText(text, voiceGender, () => setIsSpeaking(false))
  }

  useEffect(() => {
    setSpeechSupported(isSpeechSynthesisSupported() && speech.isSupported)
  }, [speech.isSupported])

  // Süre sayacı: mülakat devam ederken çalışır.
  useEffect(() => {
    if (status !== 'in_progress') return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [status])

  // Yeni mülakatçı sorusu geldiğinde sesli modda seslendir.
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const last = messages[messages.length - 1]
      if (voiceMode && last.role === 'interviewer') speak(last.content)
    }
    prevMessageCountRef.current = messages.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, voiceMode])

  useEffect(() => {
    if (speech.transcript) setInput(speech.transcript)
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
      setIsSpeaking(false)
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
    if (speech.isListening) speech.stop()

    setMessages((prev) => [...prev, { role: 'candidate', content } as MockInterviewMessage])

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
    cancelSpeech()
    setIsSpeaking(false)
    try {
      const res = await fetch(`/api/mock-interview/${interview.id}/finish`, { method: 'POST' })
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
      const res = await fetch(`/api/mock-interview/${interview.id}/retry-feedback`, { method: 'POST' })
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

  // ---- Tamamlandı: geri bildirim raporu ----
  if (status === 'completed') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        {feedback ? (
          <InterviewFeedbackReport feedback={feedback} overallScore={overallScore ?? 0} />
        ) : (
          <div className="space-y-3 rounded-xl border border-purple-200 bg-purple-50 p-5 text-sm text-purple-700">
            <p>{t.interview.feedbackFailed}</p>
            <Button onClick={retryFeedback} disabled={retrying} variant="secondary">
              {retrying ? <Spinner /> : t.interview.retry}
            </Button>
          </div>
        )}
      </div>
    )
  }

  // ---- Devam eden mülakat: sürükleyici sahne ----
  const lastInterviewer = [...messages].reverse().find((m) => m.role === 'interviewer')
  const currentQuestion = lastInterviewer?.content ?? ''
  const aiActive = loading || isSpeaking
  const qNumber = Math.min(questionCount, MOCK_INTERVIEW_QUESTION_COUNT)
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const ss = String(elapsed % 60).padStart(2, '0')

  const statusInfo = loading
    ? { text: t.interview.statusThinking, dot: '#fbbf24' }
    : isSpeaking
      ? { text: t.interview.statusSpeaking, dot: '#a855f7' }
      : speech.isListening
        ? { text: t.interview.statusListening, dot: '#39d98a' }
        : { text: t.interview.statusYourTurn, dot: '#39d98a' }

  const pill =
    'flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium'

  return (
    <div
      className="relative flex h-full min-h-[640px] flex-col overflow-hidden rounded-2xl text-purple-50"
      style={{ background: STAGE_BG, fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <style>{KEYFRAMES}</style>

      {/* arka plan parıltısı */}
      <div
        className="pointer-events-none absolute left-1/2 top-[42%] z-0 h-[520px] w-[520px] rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(168,85,247,0.40) 0%, rgba(124,58,237,0.16) 42%, rgba(124,58,237,0) 70%)',
          filter: 'blur(8px)',
          transform: 'translate(-50%,-50%)',
          animation: 'mi-glow 7s ease-in-out infinite',
        }}
      />

      {/* HEADER */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{
              background: 'linear-gradient(135deg,#a855f7,#6d28d9)',
              boxShadow: '0 4px 18px rgba(124,58,237,0.5)',
            }}
          >
            AI
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-purple-50">{jobTitle}</div>
            <div className="truncate text-[11px] tracking-wide text-purple-300">{company}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className={`${pill} border-purple-400/30 bg-purple-500/10`}>
            <span className="text-purple-200">{t.interview.questionLabel}</span>
            <span className="font-semibold text-white">{qNumber}</span>
            <span className="text-purple-300/60">/ {MOCK_INTERVIEW_QUESTION_COUNT}</span>
          </div>
          <div className={`${pill} border-white/10 bg-white/5`}>
            <span
              className="h-1.5 w-1.5 rounded-full bg-rose-500"
              style={{ boxShadow: '0 0 8px #f0436a' }}
            />
            <span className="tabular-nums tracking-wide text-purple-50">
              {mm}:{ss}
            </span>
          </div>

          {speechSupported && voiceMode && (
            <div className="flex overflow-hidden rounded-full border border-white/12 text-xs">
              <button
                onClick={() => setVoiceGender('female')}
                className={`px-3 py-1.5 ${voiceGender === 'female' ? 'bg-purple-600 text-white' : 'text-purple-200 hover:bg-white/10'}`}
              >
                {t.interview.voiceFemale}
              </button>
              <button
                onClick={() => setVoiceGender('male')}
                className={`px-3 py-1.5 ${voiceGender === 'male' ? 'bg-purple-600 text-white' : 'text-purple-200 hover:bg-white/10'}`}
              >
                {t.interview.voiceMale}
              </button>
            </div>
          )}
          {speechSupported && (
            <button
              onClick={toggleVoiceMode}
              title={voiceMode ? t.interview.voiceOffTitle : t.interview.voiceOnTitle}
              className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                voiceMode
                  ? 'border-purple-400/40 bg-purple-500/20 text-purple-100'
                  : 'border-white/12 bg-white/5 text-purple-200 hover:bg-white/10'
              }`}
            >
              {voiceMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
          )}

          <button
            onClick={finishInterview}
            disabled={loading}
            className="rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-1.5 text-xs font-semibold text-rose-200 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
          >
            {t.interview.finish}
          </button>
        </div>
      </header>

      {/* STAGE */}
      <main className="relative z-[5] flex flex-1 flex-col items-center justify-center gap-5 px-6 py-2 text-center">
        {/* avatar */}
        <div
          className="relative flex h-44 w-44 shrink-0 items-center justify-center sm:h-52 sm:w-52"
          style={{ animation: 'mi-bob 4.5s ease-in-out infinite' }}
        >
          {aiActive && (
            <>
              <span
                className="absolute inset-0 rounded-full border-2 border-purple-400/70"
                style={{ animation: 'mi-pulsering 2.4s ease-out infinite' }}
              />
              <span
                className="absolute inset-0 rounded-full border-2 border-purple-400/70"
                style={{ animation: 'mi-pulsering 2.4s ease-out infinite', animationDelay: '1.2s' }}
              />
            </>
          )}
          <div
            className="relative flex h-40 w-40 items-center justify-center rounded-full sm:h-44 sm:w-44"
            style={{
              background: 'linear-gradient(135deg,#b07cff,#6d28d9 60%,#3b1d80)',
              boxShadow: '0 0 50px rgba(124,58,237,0.45)',
            }}
          >
            <Bot className="h-16 w-16 text-white/90" strokeWidth={1.5} />

            {/* konuşurken ağız ekolayzeri */}
            {isSpeaking && (
              <div
                className="absolute bottom-6 left-1/2 flex h-7 -translate-x-1/2 items-end gap-[3px] rounded-xl px-2.5 py-1.5"
                style={{ background: 'rgba(11,7,22,0.62)', backdropFilter: 'blur(3px)' }}
              >
                {MOUTH_BARS.map((b, i) => (
                  <span
                    key={i}
                    className="block w-[3px] rounded-sm"
                    style={{
                      height: '14px',
                      background: '#f0d9ff',
                      transformOrigin: 'center bottom',
                      animation: `mi-eqbar ${b.dur} ease-in-out infinite`,
                      animationDelay: b.delay,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* durum */}
        <div className="flex items-center gap-2.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: statusInfo.dot, boxShadow: `0 0 10px ${statusInfo.dot}` }}
          />
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-purple-200">
            {statusInfo.text}
          </span>
        </div>

        {/* soru */}
        <div className="max-w-2xl px-3">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-purple-300/70">
            {t.interview.aiInterviewer}
          </div>
          <div className="text-pretty text-xl font-medium leading-relaxed text-purple-50 sm:text-2xl">
            {currentQuestion}
          </div>
        </div>
      </main>

      {/* ANSWER DOCK */}
      <footer className="relative z-10 flex flex-col items-center gap-3 px-5 pb-6 pt-2">
        {error && <p className="text-xs text-rose-300">{error}</p>}

        {/* döküm (toggle) */}
        {messages.length > 1 && (
          <button
            onClick={() => setShowTranscript((v) => !v)}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-purple-300/70 hover:text-purple-100"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${showTranscript ? 'rotate-180' : ''}`}
            />
            {showTranscript ? t.interview.hideTranscript : t.interview.showTranscript}
          </button>
        )}
        {showTranscript && (
          <div className="max-h-52 w-full max-w-2xl space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'candidate' ? 'text-right' : 'text-left'}>
                <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-purple-300/60">
                  <span className={m.role === 'candidate' ? 'ml-auto' : ''}>
                    {m.role === 'interviewer' ? t.interview.interviewer : t.interview.you}
                  </span>
                  {m.role === 'interviewer' && speechSupported && (
                    <button
                      onClick={() => speak(m.content)}
                      title={t.interview.readAloud}
                      className="text-purple-300/60 hover:text-purple-100"
                    >
                      <Volume2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                    m.role === 'candidate'
                      ? 'bg-purple-600/80 text-white'
                      : 'bg-white/8 text-purple-50'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* canlı cevap paneli */}
        <div
          className="w-full max-w-2xl rounded-2xl border border-purple-400/20 p-3.5"
          style={{ background: 'rgba(124,58,237,0.07)', backdropFilter: 'blur(6px)' }}
        >
          <div className="flex items-end gap-3">
            {speech.isListening && (
              <div className="flex h-8 shrink-0 items-center gap-[3px]">
                {USER_BARS.map((b, i) => (
                  <span
                    key={i}
                    className="block w-[3px] rounded-sm"
                    style={{
                      height: '26px',
                      background: 'linear-gradient(180deg,#c084fc,#7c3aed)',
                      transformOrigin: 'center',
                      animation: `mi-userwave ${b.dur} ease-in-out infinite`,
                      animationDelay: b.delay,
                    }}
                  />
                ))}
              </div>
            )}
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder={speech.isListening ? t.interview.listening : t.interview.answerPlaceholder}
              disabled={loading}
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-purple-50 placeholder:text-purple-300/50 focus:outline-none"
            />
          </div>
        </div>

        {/* kontroller */}
        <div className="flex items-center gap-3">
          {voiceMode && (
            <button
              onClick={() => (speech.isListening ? speech.stop() : speech.start())}
              disabled={loading}
              title={speech.isListening ? t.interview.stopListening : t.interview.answerByVoice}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
                speech.isListening
                  ? 'border-rose-400/50 bg-rose-500/20 text-rose-200'
                  : 'border-white/14 bg-white/5 text-purple-100 hover:bg-white/10'
              }`}
            >
              <Mic className={`h-5 w-5 ${speech.isListening ? 'animate-pulse' : ''}`} />
            </button>
          )}
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="flex items-center gap-2.5 rounded-full px-7 py-3.5 text-[15px] font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg,#a855f7,#6d28d9)',
              boxShadow: '0 8px 26px rgba(124,58,237,0.5)',
            }}
          >
            {loading ? <Spinner /> : <Send className="h-4 w-4" />}
            {t.interview.sendAnswer}
          </button>
        </div>
      </footer>
    </div>
  )
}
