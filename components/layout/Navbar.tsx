import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME } from '@/utils/constants'
import { NavbarAuth } from '@/components/layout/NavbarAuth'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { getServerDict } from '@/lib/i18n-server'

export function Navbar() {
  const t = getServerDict()
  return (
    <header className="mx-4 mt-4 rounded-[2rem] bg-white shadow-lg shadow-slate-300/50 sm:mx-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
        <Link href="/" className="col-start-1 flex items-center gap-2">
          <Image src="/logo.png" alt="Wisparkr" width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold text-purple-600">{APP_NAME}</span>
        </Link>
        <nav className="col-start-2 hidden items-center gap-6 text-sm text-slate-500 md:flex">
          <Link href="/#features" className="hover:text-slate-900">{t.nav.features}</Link>
          <Link href="/pricing" className="hover:text-slate-900">{t.nav.pricing}</Link>
        </nav>
        <div className="col-start-3 flex items-center justify-end gap-4">
          <LanguageSwitcher />
          <NavbarAuth />
        </div>
      </div>
    </header>
  )
}
