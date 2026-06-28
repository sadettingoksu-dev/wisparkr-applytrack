'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

export function useSpeechRecognition() {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const shouldListenRef = useRef(false)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(Boolean(SR))
  }, [])

  const createAndStart = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = 'tr-TR'
    recognition.interimResults = true
    recognition.continuous = true
    let lastFinalIndex = -1
    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          if (i > lastFinalIndex) {
            finalTranscriptRef.current += `${result[0].transcript} `
            lastFinalIndex = i
          }
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(`${finalTranscriptRef.current}${interim}`.trim())
    }
    recognition.onend = () => {
      // Tarayıcı sessizlik nedeniyle dinlemeyi otomatik kapatabilir;
      // kullanıcı durdurmadıysa dinlemeye devam et.
      if (shouldListenRef.current) {
        recognition.start()
      } else {
        setIsListening(false)
      }
    }
    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setError(event.error)
      shouldListenRef.current = false
      setIsListening(false)
    }
    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const start = useCallback(() => {
    finalTranscriptRef.current = ''
    setTranscript('')
    setError(null)
    shouldListenRef.current = true
    setIsListening(true)
    createAndStart()
  }, [createAndStart])

  const stop = useCallback(() => {
    shouldListenRef.current = false
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { isSupported, isListening, transcript, error, start, stop }
}
