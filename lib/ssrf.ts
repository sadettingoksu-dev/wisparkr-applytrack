import { lookup } from 'node:dns/promises'
import net from 'node:net'

/**
 * SSRF koruması: kullanıcının verdiği bir URL'yi sunucudan fetch etmeden önce
 * hedefin gerçekten genel (public) bir adres olduğunu doğrular. İç ağ, loopback,
 * link-local ve cloud-metadata adreslerine istek atılmasını engeller; yalnızca
 * http/https şemasına izin verir; redirect'leri manuel takip edip her adımı
 * yeniden doğrular (redirect ile iç adrese atlama bypass'ını kapatır); timeout
 * ve maksimum yanıt boyutu uygular.
 */

const MAX_REDIRECTS = 4
const FETCH_TIMEOUT_MS = 10_000
const MAX_BYTES = 3 * 1024 * 1024 // 3MB

function ipv4ToInt(ip: string): number {
  const p = ip.split('.').map(Number)
  return (((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]) >>> 0
}

function inV4(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split('/')
  const bits = Number(bitsStr)
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
  return (ipv4ToInt(ip) & mask) === (ipv4ToInt(range) & mask)
}

// Genele kapalı / hassas IPv4 blokları (RFC1918, loopback, link-local/metadata, CGNAT, reserved...)
const BLOCKED_V4 = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16', // link-local + cloud metadata (169.254.169.254)
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.0.2.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '198.51.100.0/24',
  '203.0.113.0/24',
  '224.0.0.0/4', // multicast
  '240.0.0.0/4', // reserved
]

function isBlockedV6(ip: string): boolean {
  const a = ip.toLowerCase()
  if (a === '::1' || a === '::') return true // loopback / unspecified
  if (a.startsWith('fc') || a.startsWith('fd')) return true // fc00::/7 unique-local
  if (a.startsWith('fe8') || a.startsWith('fe9') || a.startsWith('fea') || a.startsWith('feb')) return true // fe80::/10 link-local
  if (a.startsWith('ff')) return true // ff00::/8 multicast
  return false
}

export function isBlockedIp(ip: string): boolean {
  // IPv4-mapped IPv6 (::ffff:127.0.0.1) → altındaki IPv4'e indirge
  const v = ip.toLowerCase().startsWith('::ffff:') ? ip.slice(ip.lastIndexOf(':') + 1) : ip
  const type = net.isIP(v)
  if (type === 4) return BLOCKED_V4.some((cidr) => inV4(v, cidr))
  if (type === 6) return isBlockedV6(v)
  return true // çözülemeyen/bilinmeyen → engelle
}

/**
 * URL'nin güvenli (genel) olduğunu doğrular; değilse hata fırlatır.
 * Hostname literal IP ise doğrudan, değilse DNS ile çözülüp TÜM kayıtlar denetlenir.
 */
export async function assertPublicUrl(raw: string): Promise<void> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('INVALID_URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('BLOCKED_SCHEME')
  }
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new Error('BLOCKED_IP')
    return
  }
  let results: { address: string }[]
  try {
    results = await lookup(host, { all: true })
  } catch {
    throw new Error('DNS_FAILED')
  }
  if (results.length === 0) throw new Error('DNS_FAILED')
  for (const r of results) {
    if (isBlockedIp(r.address)) throw new Error('BLOCKED_IP')
  }
}

/**
 * SSRF-güvenli fetch: her redirect adımını yeniden doğrular, timeout uygular ve
 * gövdeyi MAX_BYTES ile sınırlayıp metin döndürür.
 */
export async function safeFetchText(
  raw: string,
  init: { headers?: Record<string, string> } = {}
): Promise<{ ok: boolean; status: number; text: string }> {
  let current = raw
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(current)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(current, {
        headers: init.headers,
        redirect: 'manual',
        signal: ctrl.signal,
      })
    } finally {
      clearTimeout(timer)
    }

    // Redirect'i elle takip et — Location'ı bir sonraki turda yeniden doğrularız.
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc) return { ok: res.ok, status: res.status, text: '' }
      current = new URL(loc, current).toString()
      continue
    }

    const text = await readCapped(res, MAX_BYTES)
    return { ok: res.ok, status: res.status, text }
  }
  throw new Error('TOO_MANY_REDIRECTS')
}

async function readCapped(res: Response, max: number): Promise<string> {
  const reader = res.body?.getReader()
  if (!reader) return res.text()
  const chunks: Uint8Array[] = []
  let total = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.length
    if (total > max) {
      await reader.cancel()
      break
    }
    chunks.push(value)
  }
  return Buffer.concat(chunks).toString('utf-8')
}
