/**
 * Ücretsiz, anahtarsız uzaktan-iş feed'i (Remotive) + CV'ye göre yerel eşleştirme.
 *
 * Güvenlik notları:
 * - Feed yalnızca SUNUCU tarafında, SABİT bir URL'den çekilir; kullanıcı verisi
 *   (CV/e-posta) üçüncü tarafa GÖNDERİLMEZ. Eşleştirme tamamen burada, yerel
 *   anahtar-kelime karşılaştırmasıyla yapılır → sıfır PII sızıntısı.
 * - Yanıt güvenilmez kabul edilir: HTML açıklamalar düz metne indirgenir
 *   (`stripHtml`) ve React render'ında zaten escape edilir → stored-XSS yok.
 * - Her ilan URL'si http/https olarak doğrulanır (`safeHttpUrl`) → `javascript:`
 *   gibi şemalar elenir.
 * - Yanıt Next data-cache ile saatlik cache'lenir + timeout uygulanır → tek
 *   upstream çağrısı tüm kullanıcılara hizmet eder, kota tükenmez / IP banlanmaz.
 * - Ek npm bağımlılığı yok; düz `fetch` kullanılır.
 */

const FEED_URL = 'https://remotive.com/api/remote-jobs?limit=100'
const FETCH_TIMEOUT_MS = 10_000
const REVALIDATE_SECONDS = 3600 // 1 saat
const DESCRIPTION_MAX = 280

export type FeedJob = {
  id: string
  title: string
  company: string
  location: string
  url: string
  tags: string[]
  description: string
  publishedAt: string | null
}

// Eşleştirmede gürültü yapan yaygın TR/EN kelimeler (anlam taşımayanlar).
const STOPWORDS = new Set([
  've', 'ile', 'için', 'bir', 'bu', 'da', 'de', 'ya', 'veya', 'gibi', 'çok',
  'daha', 'en', 'olan', 'olarak', 'the', 'and', 'for', 'with', 'you', 'your',
  'our', 'are', 'will', 'work', 'team', 'role', 'job', 'jobs', 'who', 'what',
  'have', 'has', 'from', 'this', 'that', 'all', 'new', 'experience', 'years',
  'about', 'into', 'they', 'their', 'them', 'her', 'his',
])

/** Metni küçük harfli kelime jetonlarına ayırır (c++, c#, .net gibi teknik terimleri korur). */
function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9#+.]{2,}/g) ?? []
}

/** Güvenilmez HTML'i düz metne indirger. Render'da React zaten escape eder; bu, gürültüyü temizler. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#0*39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Yalnızca http/https URL'lere izin verir; aksi halde null (javascript:, data: vb. elenir). */
function safeHttpUrl(raw: string): string | null {
  try {
    const u = new URL(raw)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null
  } catch {
    return null
  }
}

/** Güvenilmez feed kaydını şema-bağımsız, savunmacı şekilde normalize eder. */
function normalizeJob(raw: unknown): FeedJob | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>

  const url = safeHttpUrl(typeof o.url === 'string' ? o.url : '')
  const title = typeof o.title === 'string' ? o.title.trim().slice(0, 200) : ''
  const company = typeof o.company_name === 'string' ? o.company_name.trim().slice(0, 200) : ''
  if (!url || !title || !company) return null

  const tags = Array.isArray(o.tags)
    ? o.tags.filter((t): t is string => typeof t === 'string').slice(0, 8).map((t) => t.slice(0, 40))
    : []
  const description = stripHtml(typeof o.description === 'string' ? o.description : '').slice(0, DESCRIPTION_MAX)
  const location = typeof o.candidate_required_location === 'string'
    ? o.candidate_required_location.trim().slice(0, 120)
    : ''
  const id = typeof o.id === 'number' || typeof o.id === 'string' ? String(o.id) : url
  const publishedAt = typeof o.publication_date === 'string' ? o.publication_date : null

  return { id, title, company, location, url, tags, description, publishedAt }
}

/**
 * Feed'i sunucu tarafında çeker. Hata/timeout durumunda boş dizi döner (asla throw etmez);
 * çağıran taraf boş diziyi "feed erişilemedi" olarak yorumlayabilir.
 */
export async function fetchRemoteJobs(): Promise<FeedJob[]> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(FEED_URL, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) return []
    const json: unknown = await res.json()
    const rawJobs = (json as { jobs?: unknown })?.jobs
    if (!Array.isArray(rawJobs)) return []
    return rawJobs.map(normalizeJob).filter((j): j is FeedJob => j !== null)
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}

/** CV metninden anlamlı anahtar kelime kümesi çıkarır. */
export function extractCvKeywords(cv: string): Set<string> {
  const set = new Set<string>()
  for (const tok of tokenize(cv)) {
    if (tok.length < 2 || tok.length > 30) continue
    if (STOPWORDS.has(tok)) continue
    set.add(tok)
  }
  return set
}

/** Bir ilanın CV anahtar kelimelerine uyum puanı: başlık>etiket>açıklama ağırlıklı. */
export function scoreJob(job: FeedJob, keywords: Set<string>): number {
  if (keywords.size === 0) return 0
  const titleTokens = new Set(tokenize(job.title))
  const tagTokens = new Set(job.tags.flatMap(tokenize))
  const descTokens = new Set(tokenize(job.description))
  let score = 0
  for (const kw of keywords) {
    if (titleTokens.has(kw)) score += 3
    else if (tagTokens.has(kw)) score += 2
    else if (descTokens.has(kw)) score += 1
  }
  return score
}

/** CV'ye göre uyan ilanları puanlayıp sıralar (puan>0 olanlar, en fazla `limit`). */
export function rankJobsByCv(jobs: FeedJob[], cvText: string, limit = 30): FeedJob[] {
  const keywords = extractCvKeywords(cvText)
  if (keywords.size === 0) return []
  return jobs
    .map((job) => ({ job, score: scoreJob(job, keywords) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.job)
}
