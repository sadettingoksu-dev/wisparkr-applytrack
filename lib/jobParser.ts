import * as cheerio from 'cheerio'
import type { JobParseResult } from '@/lib/types'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

function meta($: cheerio.CheerioAPI, name: string): string | undefined {
  return (
    $(`meta[property="${name}"]`).attr('content') ||
    $(`meta[name="${name}"]`).attr('content') ||
    undefined
  )
}

/** Splits a "Position at Company" / "Position - Company" style title. */
function splitTitle(title: string): { position?: string; company?: string } {
  const separators = [' at ', ' - ', ' | ', ' @ ']
  for (const sep of separators) {
    if (title.includes(sep)) {
      const [position, company] = title.split(sep)
      return { position: position?.trim(), company: company?.trim() }
    }
  }
  return { position: title.trim() }
}

/**
 * Best-effort job posting parser: fetches the URL server-side and extracts
 * company/title/description from Open Graph / meta tags. Many job boards
 * (LinkedIn, Indeed) block server-side fetches — callers should fall back
 * to manual entry on FETCH_FAILED.
 */
export async function parseJobUrl(url: string): Promise<JobParseResult> {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new Error(`FETCH_FAILED: ${res.status}`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  const ogTitle = meta($, 'og:title') || $('title').text() || ''
  const ogSiteName = meta($, 'og:site_name')
  const ogDescription = meta($, 'og:description') || meta($, 'description') || ''

  const { position, company } = splitTitle(ogTitle)

  let bodyText = ''
  if (!ogDescription) {
    bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000)
  }

  const job_description = (ogDescription || bodyText || '').slice(0, 5000)
  const position_title = position || ogTitle || 'Bilinmeyen Pozisyon'
  const company_name = ogSiteName || company || new URL(url).hostname.replace(/^www\./, '')

  return {
    company_name,
    position_title,
    job_description,
    source_url: url,
  }
}
