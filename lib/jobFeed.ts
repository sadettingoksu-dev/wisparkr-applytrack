/**
 * CV'ye göre iş ilanı feed'i — iki ücretsiz kaynaktan beslenir:
 *   1) Remotive   → uzaktan/global ilanlar (anahtarsız).
 *   2) Jooble     → Türkiye dahil yerel ilanlar (ücretsiz API anahtarı gerekir;
 *                   `JOOBLE_API_KEY` yoksa bu kaynak sessizce atlanır).
 *
 * Güvenlik notları:
 * - Çağrılar yalnızca SUNUCU tarafında yapılır. Üçüncü taraflara CV/e-posta gibi
 *   PII GÖNDERİLMEZ; Jooble'a yalnızca CV'den türetilen genel beceri terimleri
 *   (ör. "react developer") arama sorgusu olarak gider. Remotive eşleştirmesi
 *   tamamen yereldir.
 * - Yanıtlar güvenilmez kabul edilir: HTML açıklamalar düz metne indirgenir
 *   (`stripHtml`, React render'ında zaten escape edilir → stored-XSS yok) ve her
 *   ilan URL'si http/https doğrulanır (`safeHttpUrl` → `javascript:`/`data:` elenir).
 * - Yanıtlar saatlik cache + timeout ile sınırlanır → kota tükenmez / IP banlanmaz.
 * - Jooble API anahtarı yalnızca env'de tutulur, istemciye sızmaz.
 * - Ek npm bağımlılığı yok; düz `fetch`.
 */

import { unstable_cache } from 'next/cache'

const REMOTIVE_URL = 'https://remotive.com/api/remote-jobs?limit=100'
const JOOBLE_LOCATION = 'Türkiye'
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

type FetchResult = { ok: boolean; jobs: FeedJob[] }

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

/** Güvenilmez HTML'i düz metne indirger. */
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

/** Yalnızca http/https URL'lere izin verir; aksi halde null. */
function safeHttpUrl(raw: string): string | null {
  try {
    const u = new URL(raw)
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null
  } catch {
    return null
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

/** CV'deki en sık geçen anlamlı terimleri Jooble arama sorgusu olarak döndürür (genel beceriler, PII değil). */
function topCvTerms(cv: string, n = 6): string {
  const freq = new Map<string, number>()
  for (const tok of tokenize(cv)) {
    if (tok.length < 3 || tok.length > 30 || STOPWORDS.has(tok)) continue
    freq.set(tok, (freq.get(tok) ?? 0) + 1)
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map((e) => e[0])
    .join(' ')
}

/** Bir ilanın CV anahtar kelimelerine uyum puanı: başlık>etiket>açıklama ağırlıklı. */
function scoreJob(job: FeedJob, keywords: Set<string>): number {
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

// ── Remotive (uzaktan/global) ───────────────────────────────────────────────

function normalizeRemotive(raw: unknown): FeedJob | null {
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
  const id = typeof o.id === 'number' || typeof o.id === 'string' ? `remotive-${o.id}` : url
  const publishedAt = typeof o.publication_date === 'string' ? o.publication_date : null
  return { id, title, company, location, url, tags, description, publishedAt }
}

async function fetchRemotive(): Promise<FetchResult> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(REMOTIVE_URL, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) return { ok: false, jobs: [] }
    const json: unknown = await res.json()
    const rawJobs = (json as { jobs?: unknown })?.jobs
    if (!Array.isArray(rawJobs)) return { ok: false, jobs: [] }
    return { ok: true, jobs: rawJobs.map(normalizeRemotive).filter((j): j is FeedJob => j !== null) }
  } catch {
    return { ok: false, jobs: [] }
  } finally {
    clearTimeout(timer)
  }
}

// ── Jooble (Türkiye dahil yerel) ─────────────────────────────────────────────

function normalizeJooble(raw: unknown): FeedJob | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const url = safeHttpUrl(typeof o.link === 'string' ? o.link : '')
  const title = typeof o.title === 'string' ? o.title.trim().slice(0, 200) : ''
  const company = typeof o.company === 'string' && o.company.trim()
    ? o.company.trim().slice(0, 200)
    : (typeof o.source === 'string' ? o.source.trim().slice(0, 200) : '')
  if (!url || !title || !company) return null
  const description = stripHtml(typeof o.snippet === 'string' ? o.snippet : '').slice(0, DESCRIPTION_MAX)
  const location = typeof o.location === 'string' ? o.location.trim().slice(0, 120) : ''
  const id = typeof o.id === 'number' || typeof o.id === 'string' ? `jooble-${o.id}` : url
  const publishedAt = typeof o.updated === 'string' ? o.updated : null
  return { id, title, company, location, url, tags: [], description, publishedAt }
}

/** Jooble'a POST atar; başarısızlıkta throw eder (cache'in hatayı saklamaması için). */
async function joobleRequest(query: string, location: string): Promise<FeedJob[]> {
  const apiKey = process.env.JOOBLE_API_KEY
  if (!apiKey) return []
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`https://jooble.org/api/${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ keywords: query, location }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`JOOBLE_${res.status}`)
    const json: unknown = await res.json()
    const rawJobs = (json as { jobs?: unknown })?.jobs
    if (!Array.isArray(rawJobs)) return []
    return rawJobs.map(normalizeJooble).filter((j): j is FeedJob => j !== null)
  } finally {
    clearTimeout(timer)
  }
}

// Sorgu+konum bazında saatlik cache (POST fetch otomatik cache'lenmediği için unstable_cache ile).
const cachedJooble = unstable_cache(
  (query: string, location: string) => joobleRequest(query, location),
  ['jooble-jobs'],
  { revalidate: REVALIDATE_SECONDS },
)

async function fetchJooble(query: string): Promise<FetchResult> {
  // Anahtar yoksa veya sorgu boşsa: kaynak yok say (hata değil) → sadece Remotive çalışır.
  if (!process.env.JOOBLE_API_KEY || !query) return { ok: true, jobs: [] }
  try {
    return { ok: true, jobs: await cachedJooble(query, JOOBLE_LOCATION) }
  } catch {
    return { ok: false, jobs: [] }
  }
}

// ── Birleştirme ──────────────────────────────────────────────────────────────

function dedupeByUrl(jobs: FeedJob[]): FeedJob[] {
  const seen = new Set<string>()
  const out: FeedJob[] = []
  for (const j of jobs) {
    if (seen.has(j.url)) continue
    seen.add(j.url)
    out.push(j)
  }
  return out
}

/**
 * CV'ye göre eşleşen ilanları döndürür. Jooble (Türkiye) sonuçları — varsa —
 * önce listelenir; ardından CV'ye yerel olarak uyan Remotive ilanları eklenir.
 * `reachable`: en az bir kaynağa erişilebildi mi (boş liste "erişilemedi"den ayırt edilsin diye).
 */
export async function getCvMatchedJobs(
  cvText: string,
  limit = 30,
): Promise<{ jobs: FeedJob[]; reachable: boolean }> {
  const keywords = extractCvKeywords(cvText)
  const query = topCvTerms(cvText)

  const [remote, jooble] = await Promise.all([fetchRemotive(), fetchJooble(query)])

  const rankedRemote = remote.jobs
    .map((job) => ({ job, score: scoreJob(job, keywords) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.job)

  const merged = dedupeByUrl([...jooble.jobs, ...rankedRemote]).slice(0, limit)
  return { jobs: merged, reachable: remote.ok || jooble.ok }
}
