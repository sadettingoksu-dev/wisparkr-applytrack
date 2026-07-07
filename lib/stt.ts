// Sunucu tarafli konusma-yaziya (STT) yapilandirmasi. Saglayici, hangi API
// anahtari tanimliysa ona gore secilir (ikisi de OpenAI-uyumlu /audio/transcriptions):
//   - GROQ_API_KEY   -> Groq (whisper-large-v3) — hizli, ucuz, comert ucretsiz kota
//   - OPENAI_API_KEY -> OpenAI (whisper-1)
// Hicbiri yoksa STT devre disidir (istemci yazili moda duser).

export interface SttConfig {
  key: string
  url: string
  model: string
  provider: 'groq' | 'openai'
}

export function getSttConfig(): SttConfig | null {
  if (process.env.GROQ_API_KEY) {
    return {
      key: process.env.GROQ_API_KEY,
      url: 'https://api.groq.com/openai/v1/audio/transcriptions',
      model: process.env.STT_MODEL || 'whisper-large-v3',
      provider: 'groq',
    }
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      key: process.env.OPENAI_API_KEY,
      url: 'https://api.openai.com/v1/audio/transcriptions',
      model: process.env.STT_MODEL || 'whisper-1',
      provider: 'openai',
    }
  }
  return null
}

export function isSttConfigured(): boolean {
  return getSttConfig() !== null
}

/**
 * Bir ses dosyasini (webm/mp4/wav vb.) STT saglayicisina gonderip metni dondurur.
 * `lang` BCP-47 kisa dil kodu (tr/en/de/es/fr) — dogruluk icin ipucu olarak verilir.
 */
export async function transcribeAudio(
  file: Blob,
  filename: string,
  lang: string,
  cfg: SttConfig = getSttConfig()!
): Promise<string> {
  const form = new FormData()
  form.append('file', file, filename)
  form.append('model', cfg.model)
  if (lang) form.append('language', lang)
  form.append('response_format', 'json')
  // Bos/gurultulu kayitta uydurma metin uretmesini azalt.
  form.append('temperature', '0')

  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.key}` },
    body: form,
  })
  if (!res.ok) {
    throw new Error(`STT provider error ${res.status}`)
  }
  const json = (await res.json()) as { text?: string }
  return (json.text ?? '').trim()
}
