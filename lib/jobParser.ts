import * as cheerio from 'cheerio'
import type { JobParseResult } from '@/lib/types'
import { getAnthropicClient, extractJobPosting } from '@/lib/anthropic'
import { safeFetchText } from '@/lib/ssrf'

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
 * Fetches the URL server-side and extracts company/title/description. When an
 * Anthropic key is configured, the page's visible text is handed to the AI to
 * pull clean structured fields; otherwise (or if the AI call fails) it falls
 * back to Open Graph / meta-tag heuristics. Many job boards (LinkedIn, Indeed)
 * block server-side fetches — callers should handle FETCH_FAILED.
 */
export async function parseJobUrl(url: string): Promise<JobParseResult> {
  // SSRF korumalı fetch: iç ağ/loopback/metadata adresleri engellenir,
  // redirect'ler her adımda yeniden doğrulanır, timeout + boyut limiti uygulanır.
  const res = await safeFetchText(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
  })

  if (!res.ok) {
    throw new Error(`FETCH_FAILED: ${res.status}`)
  }

  const html = res.text
  const $ = cheerio.load(html)

  // Strip noise before reading the visible text so the AI sees real content.
  $('script, style, noscript, svg, header, footer, nav').remove()

  const ogTitle = meta($, 'og:title') || $('title').text() || ''
  const ogSiteName = meta($, 'og:site_name')
  const ogDescription = meta($, 'og:description') || meta($, 'description') || ''
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

  // Heuristic fallback values used when AI isn't available or comes up empty.
  const { position, company } = splitTitle(ogTitle)
  const fallbackDescription = (ogDescription || bodyText).slice(0, 5000)
  const fallbackPosition = position || ogTitle || 'Bilinmeyen Pozisyon'
  const fallbackCompany =
    ogSiteName || company || new URL(url).hostname.replace(/^www\./, '')

  const anthropic = getAnthropicClient()
  if (anthropic) {
    try {
      const pageText = `${ogTitle}\n${ogDescription}\n${bodyText}`.trim()
      const ai = await extractJobPosting(anthropic, pageText, url)
      return {
        company_name: ai.company_name || fallbackCompany,
        position_title: ai.position_title || fallbackPosition,
        job_description: (ai.job_description || fallbackDescription).slice(0, 5000),
        source_url: url,
      }
    } catch {
      // fall through to heuristic result below
    }
  }

  return {
    company_name: fallbackCompany,
    position_title: fallbackPosition,
    job_description: fallbackDescription,
    source_url: url,
  }
}
