import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, UserRound } from 'lucide-react'
import { APP_NAME } from '@/utils/constants'
import { NavbarAuth } from '@/components/layout/NavbarAuth'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { ThemeToggleButton } from '@/components/layout/ThemeToggleButton'
import { MegaMenu } from '@/components/layout/MegaMenu'
import { getServerDict, getServerLocale } from '@/lib/i18n-server'
import { getMarketing } from '@/lib/marketing'

/**
 * paytr tarzı iki katlı pazarlama navbar'ı — tek yüzen kart içinde:
 *  1) Üst yardımcı şerit: ikincil bağlantılar (Rehber, Yardım) + destek notu.
 *  2) Ana bar: logo · mega-menü · dil/tema/hesap + "Ücretsiz Başla" CTA.
 *
 * Auth/dil/tema kontrolleri mevcut bileşenlerle (değiştirilmeden) yeniden kullanılır;
 * hiçbir akış değişmez, yalnızca yerleşim paytr iskeletine yaklaştırılır.
 */
export function Navbar() {
  const t = getServerDict()
  const m = getMarketing(getServerLocale())

  return (
    <header className="mx-4 mt-4 overflow-hidden rounded-[2rem] bg-white shadow-lg shadow-slate-300/50 sm:mx-6">
      {/* Üst yardımcı şerit (masaüstü) */}
      <div className="hidden items-center justify-between border-b border-slate-100 px-6 py-2 text-xs text-slate-500 md:flex">
        <div className="flex items-center gap-4">
          <Link href="/rehber" className="transition-colors hover:text-purple-600">{m.topbar.guides}</Link>
          <span className="h-3 w-px bg-slate-200" aria-hidden />
          <Link href="/yardim" className="transition-colors hover:text-purple-600">{m.topbar.help}</Link>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium text-slate-600 transition-colors hover:text-purple-600"
        >
          <UserRound className="h-3.5 w-3.5 text-purple-500" />
          {m.topbar.panel}
        </Link>
      </div>

      {/* Ana bar */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
        <Link href="/" className="col-start-1 flex items-center gap-2">
          <Image src="/logo.png" alt={APP_NAME} width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold text-slate-900">{APP_NAME}</span>
        </Link>

        <nav className="col-start-2 hidden md:flex">
          <MegaMenu />
        </nav>

        <div className="col-start-3 flex items-center justify-end gap-3">
          <LanguageSwitcher />
          <ThemeToggleButton />
          <NavbarAuth />
          <Link href="/signup" className="hidden sm:block">
            <button className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-300/40 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300">
              {m.topbar.start}
              <ArrowRight className="h-4 w-4" />
            </button>
          </Link>
        </div>
      </div>
    </header>
  )
}
