'use client'

import { useCallback, useRef, useState } from 'react'

/**
 * getUserMedia + MediaRecorder tabanlı ses kaydı — sunucu tarafı STT içindir.
 * webkitSpeechRecognition'ın aksine Google konuşma sunucusuna bağımlı DEĞİLDİR;
 * Chrome/Edge/Firefox/Safari ve mobilde çalışır ('network' hatası olmaz).
 *
 * Eller-serbest hissi için basit bir VAD (ses seviyesi ölçümü) ile: kullanıcı
 * konuşmayı bırakıp ~sessizlik eşiğini aşınca kayıt OTOMATİK durur ve
 * `onComplete(blob)` tetiklenir. Manuel durdurma da desteklenir.
 */
export function useAudioRecorder() {
  const [isSupported] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== 'undefined'
  )
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** 0-1 arası anlık ses seviyesi (dalga animasyonu için). */
  const [level, setLevel] = useState(0)

  const mrRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const onCompleteRef = useRef<(blob: Blob | null) => void>(() => {})

  // VAD durumu
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const spokeRef = useRef(false)
  const silenceStartRef = useRef<number | null>(null)
  const startedAtRef = useRef(0)

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setLevel(0)
  }, [])

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    const mr = mrRef.current
    if (mr && mr.state !== 'inactive') {
      try {
        mr.stop()
      } catch {
        /* yoksay */
      }
    }
    setIsRecording(false)
  }, [])

  const start = useCallback(
    async (onComplete: (blob: Blob | null) => void) => {
      setError(null)
      onCompleteRef.current = onComplete
      spokeRef.current = false
      silenceStartRef.current = null
      startedAtRef.current = Date.now()
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        })
        streamRef.current = stream

        const mime = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : ''
        const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
        chunksRef.current = []
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
        }
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
          cleanup()
          onCompleteRef.current(blob.size > 0 ? blob : null)
        }
        mr.start()
        mrRef.current = mr
        setIsRecording(true)

        // --- VAD: ses seviyesini ölç, konuşma sonrası sessizlikte otomatik durdur ---
        const AudioCtx =
          window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        const ctx = new AudioCtx()
        audioCtxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 1024
        source.connect(analyser)
        const buf = new Uint8Array(analyser.fftSize)

        const SPEAK_THRESHOLD = 0.045 // bunun üstü = konuşma
        const SILENCE_THRESHOLD = 0.03 // bunun altı = sessizlik
        const SILENCE_MS = 2200 // konuşmadan sonra bu kadar sessizlik → gönder
        const MAX_MS = 90000 // güvenlik: en fazla 90 sn kayıt

        const tick = () => {
          analyser.getByteTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128
            sum += v * v
          }
          const rms = Math.sqrt(sum / buf.length)
          setLevel(Math.min(1, rms * 4))

          const now = Date.now()
          if (rms > SPEAK_THRESHOLD) {
            spokeRef.current = true
            silenceStartRef.current = null
          } else if (rms < SILENCE_THRESHOLD && spokeRef.current) {
            if (silenceStartRef.current == null) silenceStartRef.current = now
            else if (now - silenceStartRef.current > SILENCE_MS) {
              stop()
              return
            }
          }
          if (now - startedAtRef.current > MAX_MS) {
            stop()
            return
          }
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
      } catch (e: unknown) {
        const name = (e as { name?: string } | null)?.name
        setError(name === 'NotAllowedError' ? 'not-allowed' : name === 'NotFoundError' ? 'audio-capture' : 'mic-error')
        cleanup()
        setIsRecording(false)
      }
    },
    [cleanup, stop]
  )

  return { isSupported, isRecording, level, error, start, stop }
}
