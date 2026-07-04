export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export type VoiceGender = 'female' | 'male'

/** Uygulama locale'ini (tr/en/de/es/fr) konuşma motorunun BCP-47 diline çevirir. */
export function localeToSpeechLang(locale: string | undefined): string {
  switch (locale) {
    case 'en':
      return 'en-US'
    case 'de':
      return 'de-DE'
    case 'es':
      return 'es-ES'
    case 'fr':
      return 'fr-FR'
    case 'tr':
    default:
      return 'tr-TR'
  }
}

/**
 * Tarayıcı ses listesini yükler. `getVoices()` ilk çağrıda genelde BOŞ döner
 * (sesler asenkron yüklenir); bu yüzden `voiceschanged` olayını bekleriz.
 * Bu, "ilk soruda kadın sesi gelmiyor" hatasının kök nedeniydi: sesler
 * yüklenmeden önce seçim yapılınca sistem varsayılan (çoğunlukla erkek) sesi
 * kullanılıyordu.
 */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) return resolve([])
    const existing = window.speechSynthesis.getVoices()
    if (existing.length > 0) return resolve(existing)

    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true })
    // Bazı tarayıcılarda olay hiç tetiklenmez; güvenlik için kısa bir timeout.
    setTimeout(finish, 1200)
  })
}

/** Sesleri önceden ısıt (sayfa açılır açılmaz çağrılır ki ilk konuşma gecikmesin). */
export function warmUpVoices(): void {
  if (isSpeechSynthesisSupported()) void loadVoices()
}

const FEMALE_NAME_RE = /emel|filiz|yelda|zira|aria|jenny|female|kadın|weiblich|femme|mujer|hazel|susan|linda|katja|hedda|helena|elsa|paulina|amelie/i
const MALE_NAME_RE = /ahmet|tolga|mert|male|erkek|david|mark|guy|stefan|hans|conrad|jorge|pablo|paul|thomas|männ|homme|hombre/i
const NATURAL_RE = /natural|online|neural|premium/i

function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: string,
  gender: VoiceGender
): SpeechSynthesisVoice | undefined {
  const base = lang.split('-')[0]
  // Önce tam dil eşleşmesi, yoksa aynı dil ailesi.
  const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(base))
  if (langVoices.length === 0) return undefined

  const isNatural = (v: SpeechSynthesisVoice) => NATURAL_RE.test(v.name)
  const wanted = gender === 'female' ? FEMALE_NAME_RE : MALE_NAME_RE
  const opposite = gender === 'female' ? MALE_NAME_RE : FEMALE_NAME_RE

  // Öncelik sırası: doğal + istenen cinsiyet → istenen cinsiyet → doğal ama karşı
  // cinsiyet DEĞİL → karşı cinsiyet olmayan herhangi biri → en kötü ihtimalle ilki.
  return (
    langVoices.find((v) => isNatural(v) && wanted.test(v.name)) ??
    langVoices.find((v) => wanted.test(v.name)) ??
    langVoices.find((v) => isNatural(v) && !opposite.test(v.name)) ??
    langVoices.find((v) => !opposite.test(v.name)) ??
    langVoices[0]
  )
}

export interface SpeakOptions {
  gender?: VoiceGender
  /** BCP-47 dil kodu (örn. 'tr-TR', 'en-US'). Verilmezse Türkçe. */
  lang?: string
  onEnd?: () => void
  /** Her kelime sınırında tetiklenir; ağız senkronu için kullanılır. */
  onBoundary?: () => void
}

export async function speakText(text: string, opts: SpeakOptions = {}): Promise<void> {
  if (!isSpeechSynthesisSupported()) {
    opts.onEnd?.()
    return
  }
  const { gender = 'female', lang = 'tr-TR', onEnd, onBoundary } = opts

  const voices = await loadVoices()
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang

  const selectedVoice = pickVoice(voices, lang, gender)
  if (selectedVoice) {
    utterance.voice = selectedVoice
    utterance.lang = selectedVoice.lang
  }

  // Seçilen ses gerçekten istenen cinsiyette değilse (ör. sistemde yalnızca erkek
  // Türkçe ses varsa) pitch ile cinsiyet hissini güçlendir.
  const nameMatchesWanted =
    selectedVoice && (gender === 'female' ? FEMALE_NAME_RE : MALE_NAME_RE).test(selectedVoice.name)
  if (gender === 'female') {
    utterance.pitch = nameMatchesWanted ? 1.0 : 1.35
    utterance.rate = 1.0
  } else {
    utterance.pitch = nameMatchesWanted ? 0.95 : 0.8
    utterance.rate = 0.98
  }

  if (onEnd) {
    utterance.onend = onEnd
    utterance.onerror = onEnd
  }
  if (onBoundary) {
    utterance.onboundary = () => onBoundary()
  }
  window.speechSynthesis.speak(utterance)
}

export function cancelSpeech(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel()
}
