'use client'

import { useState, useEffect, useRef } from 'react'
import { Mic, Volume2, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { InterviewAvatar } from '@/components/interview/InterviewAvatar'
import { InterviewFeedbackReport } from '@/components/interview/InterviewFeedbackReport'
import { MOCK_INTERVIEW_QUESTION_COUNT } from '@/utils/constants'
import {
  isSpeechSynthesisSupported,
  speakText,
  cancelSpeech,
  warmUpVoices,
  localeToSpeechLang,
  type VoiceGender,
} from '@/lib/speech'
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

const USER_BARS = [
  { dur: '0.6s', delay: '0s' }, { dur: '0.4s', delay: '0.1s' }, { dur: '0.7s', delay: '0.05s' },
  { dur: '0.5s', delay: '0.18s' }, { dur: '0.38s', delay: '0.12s' }, { dur: '0.62s', delay: '0.03s' },
  { dur: '0.46s', delay: '0.15s' }, { dur: '0.54s', delay: '0.08s' }, { dur: '0.42s', delay: '0.2s' },
]

const STAGE_BG =
  'radial-gradient(120% 120% at 50% 18%, #2a1458 0%, #18103a 38%, #0d0820 72%, #070411 100%)'

export function MockInterviewChat({ interview, initialMessages, jobTitle, company }: MockInterviewChatProps) {
  const { t, locale } = useI18n()
  const speechLang = localeToSpeechLang(locale)
  const [messages, setMessages] = useState(initialMessages)
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
  const [started, setStarted] = useState(false)
  const [micBlocked, setMicBlocked] = useState(false)
  // Sesle cevap alınmıyorsa (mikrofon/tarayıcı/internet) yazarak gönderme yedeği.
  const [typed, setTyped] = useState('')
  const speech = useSpeechRecognition(speechLang)
  const prevMessageCountRef = useRef(initialMessages.length)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function speak(text: string) {
    if (!isSpeechSynthesisSupported()) return
    setIsSpeaking(true)
    void speakText(text, {
      gender: voiceGender,
      lang: speechLang,
      onEnd: () => setIsSpeaking(false),
    })
  }

  // Soruyu sesli oku, bittiğinde mikrofonu otomatik dinlemeye başlat (el değmeden).
  function speakThenListen(text: string) {
    if (!isSpeechSynthesisSupported()) {
      try {
        speech.start()
      } catch {
        /* yoksay */
      }
      return
    }
    setIsSpeaking(true)
    void speakText(text, {
      gender: voiceGender,
      lang: speechLang,
      onEnd: () => {
        setIsSpeaking(false)
        try {
          speech.start()
        } catch {
          /* izin verilmemişse kullanıcı mikrofon butonuna basabilir */
        }
      },
    })
  }

  // Görüşmeyi başlat: tek dokunuş (kullanıcı hareketi) ile mikrofon iznini al,
  // sesli modu aç, ilk soruyu oku ve dinlemeye geç. Tarayıcılar izinsiz/otomatik
  // mikrofon başlatmayı engellediği için bu jest şart.
  async function beginInterview() {
    setStarted(true)
    setMicBlocked(false)
    setVoiceMode(true)
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((tr) => tr.stop()) // sadece izin gerekiyordu
      }
    } catch {
      setMicBlocked(true)
      setVoiceMode(false)
      return
    }
    const firstQuestion = [...messages].reverse().find((m) => m.role === 'interviewer')?.content
    if (firstQuestion) speakThenListen(firstQuestion)
  }

  useEffect(() => {
    setSpeechSupported(isSpeechSynthesisSupported() && speech.isSupported)
    // Tarayıcı seslerini önceden yükle: ilk soru okunurken doğru (kadın) ses hazır olsun.
    warmUpVoices()
  }, [speech.isSupported])

  // Mikrofon izni reddedilirse: sesli modu kapat, kullanıcıyı bilgilendir, yazıya düş.
  useEffect(() => {
    if (speech.error === 'not-allowed' || speech.error === 'service-not-allowed') {
      setMicBlocked(true)
      setVoiceMode(false)
    }
  }, [speech.error])

  // Süre sayacı: mülakat devam ederken çalışır.
  useEffect(() => {
    if (status !== 'in_progress') return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [status])

  // Yeni mülakatçı sorusu geldiğinde sesli modda oku ve ardından dinlemeye geç.
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const last = messages[messages.length - 1]
      if (voiceMode && last.role === 'interviewer') speakThenListen(last.content)
    }
    prevMessageCountRef.current = messages.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, voiceMode])

  // ELLER SERBEST: mikrofon hep açık; kullanıcı bir süre (≈2.3 sn) konuşmayı
  // bırakınca cevabı OTOMATİK gönderir. Her yeni konuşma parçası zamanlayıcıyı
  // sıfırlar; AI konuşurken/işlerken tetiklenmez (yankı/erken gönderim önlenir).
  useEffect(() => {
    if (!voiceMode || !speech.isListening || loading || isSpeaking) return
    const text = speech.transcript.trim()
    if (text.length < 2) return
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    silenceTimerRef.current = setTimeout(() => {
      sendMessage(text)
    }, 2600)
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.transcript, speech.isListening, loading, isSpeaking, voiceMode])

  useEffect(() => {
    return () => {
      cancelSpeech()
      speech.stop()
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function sendMessage(spoken: string) {
    const content = spoken.trim()
    if (!content || loading) return
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current)
    setError(null)
    setLoading(true)
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
  // İnsan hissi için mülakatçıya isim ver (robot/"AI" yerine), sese göre değişir.
  const interviewerName = voiceGender === 'female' ? 'Elif' : 'Mert'
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

  // STT hata kodunu kullanıcının anlayacağı bir açıklamaya çevir (cihaz mı, bağlantı mı?).
  const speechErrorMsg =
    speech.error === 'audio-capture'
      ? t.interview.errAudioCapture
      : speech.error === 'network'
        ? t.interview.errNetwork
        : null

  function sendTyped() {
    const text = typed.trim()
    if (!text || loading) return
    setTyped('')
    sendMessage(text)
  }

  return (
    <div
      className="relative flex h-full min-h-[460px] flex-col overflow-hidden rounded-2xl text-purple-50"
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

      {/* BAŞLANGIÇ KAPISI — tarayıcı izni için tek dokunuş gerekir.
          Kullanıcı BAŞLAMADAN ÖNCE kadın/erkek koç seçer. */}
      {speechSupported && !started && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 px-6 text-center"
          style={{ background: 'rgba(7,4,17,0.78)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="h-24 w-24 overflow-hidden rounded-full"
            style={{ boxShadow: '0 0 50px rgba(124,58,237,0.45)' }}
          >
            <InterviewAvatar speaking={false} gender={voiceGender} size={96} />
          </div>
          <div>
            <div className="text-lg font-semibold text-purple-50">{jobTitle}</div>
            <div className="text-sm text-purple-300">{company}</div>
          </div>

          {/* Koç / ses seçimi — başlamadan önce */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-purple-300/70">
              {t.interview.coachLabel}
            </span>
            <div className="flex overflow-hidden rounded-full border border-white/15 text-sm">
              <button
                onClick={() => setVoiceGender('female')}
                className={`px-5 py-2 font-medium transition-colors ${voiceGender === 'female' ? 'bg-purple-600 text-white' : 'text-purple-200 hover:bg-white/10'}`}
              >
                {t.interview.voiceFemale}
              </button>
              <button
                onClick={() => setVoiceGender('male')}
                className={`px-5 py-2 font-medium transition-colors ${voiceGender === 'male' ? 'bg-purple-600 text-white' : 'text-purple-200 hover:bg-white/10'}`}
              >
                {t.interview.voiceMale}
              </button>
            </div>
          </div>

          <p className="max-w-sm text-sm leading-relaxed text-purple-200/80">
            {t.interview.beginHint}
          </p>
          <button
            onClick={beginInterview}
            className="flex items-center gap-2.5 rounded-full px-8 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg,#a855f7,#6d28d9)',
              boxShadow: '0 8px 26px rgba(124,58,237,0.5)',
            }}
          >
            <Mic className="h-5 w-5" />
            {t.interview.begin}
          </button>
        </div>
      )}

      {/* Tarayıcı sesli mülakatı desteklemiyorsa: bilgilendir AMA yazılı modda
          başlatmaya izin ver (kullanıcı tıkanmasın). */}
      {!speechSupported && !started && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-6 text-center"
          style={{ background: 'rgba(7,4,17,0.85)', backdropFilter: 'blur(4px)' }}
        >
          <div className="text-lg font-semibold text-purple-50">{jobTitle}</div>
          <div className="text-sm text-purple-300">{company}</div>
          <p className="max-w-sm text-sm leading-relaxed text-amber-200/90">
            {t.interview.voiceUnsupported}
          </p>
          <button
            onClick={() => {
              setStarted(true)
              setVoiceMode(false)
            }}
            className="flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg,#a855f7,#6d28d9)',
              boxShadow: '0 8px 26px rgba(124,58,237,0.5)',
            }}
          >
            {t.interview.begin}
          </button>
        </div>
      )}

      {/* HEADER */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="h-9 w-9 shrink-0 overflow-hidden rounded-xl"
            style={{ boxShadow: '0 4px 18px rgba(124,58,237,0.5)' }}
          >
            <InterviewAvatar speaking={isSpeaking} gender={voiceGender} size={36} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-purple-50">
              {interviewerName} · {jobTitle}
            </div>
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
      <main className="relative z-[5] flex flex-1 flex-col items-center justify-center gap-3 px-6 py-2 text-center">
        {/* avatar */}
        <div
          className="relative flex h-28 w-28 shrink-0 items-center justify-center sm:h-32 sm:w-32"
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
            className="relative h-24 w-24 overflow-hidden rounded-full sm:h-28 sm:w-28"
            style={{ boxShadow: '0 0 50px rgba(124,58,237,0.45)' }}
          >
            <InterviewAvatar speaking={isSpeaking} gender={voiceGender} size={112} />
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

        {/* soru: yalnızca sesli mod kapalıyken yazılı gösterilir (sesli modda AI okur) */}
        {!voiceMode ? (
          <div className="max-w-2xl px-3">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-purple-300/70">
              {interviewerName}
            </div>
            <div className="text-pretty text-lg font-medium leading-relaxed text-purple-50 sm:text-xl">
              {currentQuestion}
            </div>
          </div>
        ) : (
          <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-purple-300/70">
            {interviewerName}
          </div>
        )}
      </main>

      {/* ANSWER DOCK */}
      <footer className="relative z-10 flex flex-col items-center gap-3 px-5 pb-6 pt-2">
        {error && <p className="text-xs text-rose-300">{error}</p>}
        {micBlocked && <p className="text-xs text-amber-300">{t.interview.micBlocked}</p>}
        {speechErrorMsg && <p className="max-w-md text-center text-xs text-amber-300">{speechErrorMsg}</p>}

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
          <div className="max-h-36 w-full max-w-2xl space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-4">
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

        {/* canlı cevap paneli — SADECE SES. Konuşulan metin anlık görünür,
            yazı yazma/gönderme yok; sessizlikte cevap otomatik gider. */}
        <div
          className="w-full max-w-2xl rounded-2xl border border-purple-400/20 p-4"
          style={{ background: 'rgba(124,58,237,0.07)', backdropFilter: 'blur(6px)' }}
        >
          <div className="flex items-center gap-3">
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
            <p className="min-h-[26px] flex-1 text-left text-[15px] leading-relaxed text-purple-50">
              {speech.transcript || (
                <span className="text-purple-300/50">
                  {isSpeaking
                    ? t.interview.statusSpeaking
                    : speech.isListening
                      ? t.interview.listening
                      : t.interview.answerPlaceholder}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* YAZILI YEDEK — ses alınmıyorsa (mikrofon/tarayıcı/internet) kullanıcı
            asla tıkanmasın; her zaman yazarak cevaplayıp gönderebilir. */}
        {started && !loading && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendTyped()
            }}
            className="flex w-full max-w-2xl items-center gap-2"
          >
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={t.interview.typePlaceholder}
              className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-purple-50 placeholder:text-purple-300/50 focus:border-purple-400/50 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!typed.trim()}
              className="shrink-0 rounded-full bg-purple-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-40"
            >
              {t.interview.send}
            </button>
          </form>
        )}

        {/* durum bilgisi / güvenlik ağı — GÖNDER butonu YOK.
            Dinleme kendiliğinden başlamazsa kullanıcı yeniden dinlemeyi tetikleyebilir. */}
        <div className="flex min-h-[36px] flex-col items-center gap-2">
          {loading ? (
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-amber-300/80">
              <Spinner /> {t.interview.statusThinking}
            </span>
          ) : speech.isListening && !isSpeaking ? (
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-300/80">
              {t.interview.statusListening} · {t.interview.autoSendHint}
            </span>
          ) : voiceMode && !isSpeaking ? (
            <button
              onClick={() => {
                try {
                  speech.start()
                } catch {
                  /* yoksay */
                }
              }}
              className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-purple-100 transition-colors hover:bg-white/10"
            >
              <Mic className="h-3.5 w-3.5" />
              {t.interview.listenAgain}
            </button>
          ) : null}
        </div>
      </footer>
    </div>
  )
}
