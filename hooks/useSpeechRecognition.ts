'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

/**
 * Tarayıcı konuşma tanıma (Web Speech API) sarmalayıcısı.
 * @param lang BCP-47 dil kodu (örn. 'tr-TR', 'en-US'). Arayüz diliyle eşleşmezse
 *   kullanıcı konuşsa bile metin gelmez — bu yüzden locale'e göre verilmeli.
 */
export function useSpeechRecognition(lang: string = 'tr-TR') {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)
  const shouldListenRef = useRef(false)
  const finalTranscriptRef = useRef('')
  const langRef = useRef(lang)

  // Dil değişince güncel tut; bir sonraki start() bu dille başlar.
  useEffect(() => {
    langRef.current = lang
    // Dinleme sürerken dil değişirse tanıyıcıyı yeni dille yeniden kur.
    if (shouldListenRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.lang = lang
      } catch {
        /* yoksay */
      }
    }
  }, [lang])

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setIsSupported(Boolean(SR))
  }, [])

  const createAndStart = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = langRef.current
    recognition.interimResults = true
    recognition.continuous = true
    // Standart (MDN) desen: event.resultIndex'ten itibaren işle. Kesinleşen
    // parçaları ref'te biriktir; ara sonuçları anlık göster. Bu desen otomatik
    // yeniden başlatmadan sonra da metni KAYBETMEZ (eski index-takibi kaybediyordu).
    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscriptRef.current += `${result[0].transcript} `
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(`${finalTranscriptRef.current}${interim}`.trim())
    }
    recognition.onend = () => {
      // Tarayıcı sessizlik nedeniyle dinlemeyi otomatik kapatabilir;
      // kullanıcı durdurmadıysa yeni bir oturumla dinlemeye devam et.
      if (shouldListenRef.current) {
        try {
          recognition.start()
        } catch {
          // "already started" olursa kısa bir gecikmeyle tekrar dene.
          setTimeout(() => {
            try {
              recognition.start()
            } catch {
              /* yoksay */
            }
          }, 250)
        }
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
    try {
      recognition.start()
    } catch {
      /* yoksay */
    }
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
