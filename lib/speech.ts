export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export type VoiceGender = 'female' | 'male'

export function speakText(text: string, gender: VoiceGender = 'female', onEnd?: () => void): void {
  if (!isSpeechSynthesisSupported()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'tr-TR'

  const trVoices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('tr'))
  // İnsan gibi duyulan nöral/online sesleri her zaman önceliklendir (Edge/Win'de
  // "Microsoft Emel/Ahmet Online (Natural)" gibi). Bunlar seçilince sentetik tını
  // büyük ölçüde kaybolur.
  const isNatural = (v: SpeechSynthesisVoice) => /natural|online|neural/i.test(v.name)

  let selectedVoice: SpeechSynthesisVoice | undefined

  if (gender === 'male') {
    selectedVoice =
      trVoices.find((v) => isNatural(v) && /ahmet|tolga|male|erkek/i.test(v.name)) ??
      trVoices.find((v) => /ahmet|tolga/i.test(v.name)) ??
      trVoices.find((v) => /male|erkek/i.test(v.name)) ??
      trVoices.find(isNatural) ??
      trVoices[trVoices.length > 1 ? 1 : 0]
    // Doğal pitch — aşırı düşürmek robotik yapıyordu.
    utterance.pitch = 0.95
    utterance.rate = 1.0
  } else {
    selectedVoice =
      trVoices.find((v) => isNatural(v) && /emel|female|kadın/i.test(v.name)) ??
      trVoices.find(isNatural) ??
      trVoices.find((v) => /emel|filiz|yelda|zira|female|kadın/i.test(v.name)) ??
      trVoices[0]
    utterance.pitch = 1.0
    utterance.rate = 1.0
  }

  if (selectedVoice) utterance.voice = selectedVoice

  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel()
}
