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

  let selectedVoice: SpeechSynthesisVoice | undefined

  if (gender === 'male') {
    // Erkek ses: Tolga (Microsoft) veya male/erkek içeren
    selectedVoice =
      trVoices.find((v) => /tolga/i.test(v.name)) ??
      trVoices.find((v) => /male|erkek/i.test(v.name)) ??
      trVoices[trVoices.length > 1 ? 1 : 0]
    utterance.pitch = 0.7
    utterance.rate = 0.95
  } else {
    // Kadın ses: Emel (Microsoft, online/natural) öncelikli
    const natural = trVoices.find((v) => /natural|online|emel/i.test(v.name))
    selectedVoice =
      natural ??
      trVoices.find((v) => /female|kadın|filiz|yelda|zira/i.test(v.name)) ??
      trVoices[0]
    utterance.pitch = 0.75
    utterance.rate = 0.95
  }

  if (selectedVoice) utterance.voice = selectedVoice

  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel()
}
