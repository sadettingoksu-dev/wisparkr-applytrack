import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME } from '@/utils/constants'
import { NavbarAuth } from '@/components/layout/NavbarAuth'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { ThemeToggleButton } from '@/components/layout/ThemeToggleButton'
import { getServerDict } from '@/lib/i18n-server'

/**
 * Sade pazarlama navbar'ı — tek yüzen kart:
 *  logo · landing menüsü (Özellikler / Planlar / SSS) · dil/tema/hesap.
 *
 * Her menü başlığı ilgili ayrı sayfaya gider (anasayfa çapası değil):
 *  Özellikler → /ozellikler · Planlar → /pricing · SSS → /sss
 * Auth/dil/tema kontrolleri mevcut bileşenlerle (değiştirilmeden) kullanılır.
 */
export function Navbar() {
  const t = getServerDict()

  return (
    <header className="relative z-40 mx-4 mt-4 rounded-[2rem] bg-white shadow-lg shadow-slate-300/50 sm:mx-6">
      {/* Ana bar */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
        <Link href="/" className="col-start-1 flex items-center gap-2">
          <Image src="/logo.png" alt={APP_NAME} width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold text-slate-900">{APP_NAME}</span>
        </Link>

        <nav className="col-start-2 hidden items-center gap-6 text-sm text-slate-500 md:flex">
          <Link href="/ozellikler" className="transition-colors hover:text-slate-900">{t.nav.features}</Link>
          <Link href="/pricing" className="transition-colors hover:text-slate-900">{t.nav.pricing}</Link>
          <Link href="/sss" className="transition-colors hover:text-slate-900">{t.nav.faq}</Link>
        </nav>

        <div className="col-start-3 flex items-center justify-end gap-3">
          <LanguageSwitcher />
          <ThemeToggleButton />
          <NavbarAuth />
        </div>
      </div>
    </header>
  )
}
