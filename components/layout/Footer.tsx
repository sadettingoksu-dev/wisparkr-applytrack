import Link from 'next/link'
import { APP_NAME } from '@/utils/constants'
import { getServerDict } from '@/lib/i18n-server'

export function Footer() {
  const t = getServerDict()
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:justify-between">
        <span>© {new Date().getFullYear()} {APP_NAME} — {t.footer.rights}</span>
        <nav className="flex items-center gap-4">
          <Link href="/yardim" className="transition-colors hover:text-slate-900">{t.footer.help}</Link>
          <Link href="/privacy" className="transition-colors hover:text-slate-900">{t.footer.privacy}</Link>
          <Link href="/terms" className="transition-colors hover:text-slate-900">{t.footer.terms}</Link>
        </nav>
      </div>
    </footer>
  )
}
