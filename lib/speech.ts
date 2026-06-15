export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speakText(text: string, onEnd?: () => void): void {
  if (!isSpeechSynthesisSupported()) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'tr-TR'

  const trVoices = window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith('tr'))
  const femaleVoice =
    trVoices.find((v) => /female|kadın|filiz|yelda|zira/i.test(v.name)) ?? trVoices[0]
  if (femaleVoice) utterance.voice = femaleVoice

  // Mülakatçı için daha kalın/ciddi bir ton
  utterance.pitch = 0.75
  utterance.rate = 0.95

  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel()
}
