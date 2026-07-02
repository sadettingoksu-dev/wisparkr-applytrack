import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME } from '@/utils/constants'
import { getServerDict, getServerLocale } from '@/lib/i18n-server'
import { getMarketing } from '@/lib/marketing'

/**
 * paytr tarzı çok sütunlu footer:
 *  - Sol: marka + kısa tanım + dil/hukuk imzası.
 *  - Sağ: Ürün / Kaynaklar / Yasal bağlantı sütunları.
 *
 * Tüm hedefler var olan route'lardır (marketing.ts). Mevcut linkler korunur,
 * yalnızca çok sütunlu düzene taşınır — hiçbir sayfa/akış kaybolmaz.
 */
export function Footer() {
  const t = getServerDict()
  const m = getMarketing(getServerLocale())

  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    { title: m.footer.colProduct, links: m.footer.links.product },
    { title: m.footer.colResources, links: m.footer.links.resources },
    { title: m.footer.colLegal, links: m.footer.links.legal },
  ]

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
          {/* Marka bloğu */}
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <Image src="/logo.png" alt={APP_NAME} width={28} height={28} className="rounded-lg" />
              <span className="text-lg font-bold text-slate-900">{APP_NAME}</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">{m.footer.tagline}</p>
          </div>

          {/* Bağlantı sütunları */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 transition-colors hover:text-purple-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-slate-100 pt-6 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} {APP_NAME} — {t.footer.rights}</span>
        </div>
      </div>
    </footer>
  )
}
