import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME } from '@/utils/constants'
import { NavbarAuth } from '@/components/layout/NavbarAuth'

export function Navbar() {
  return (
    <header className="mx-4 mt-4 rounded-[2rem] bg-neutral-900 shadow-lg shadow-black/60 sm:mx-6">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-6 py-4">
        <Link href="/" className="col-start-1 flex items-center gap-2">
          <Image src="/logo-dark.png" alt="Wisparkr" width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold text-amber-500">{APP_NAME}</span>
        </Link>
        <nav className="col-start-2 hidden items-center gap-6 text-sm text-white/50 md:flex">
          <Link href="/#features" className="hover:text-white">Özellikler</Link>
          <Link href="/pricing" className="hover:text-white">Fiyatlandırma</Link>
        </nav>
        <div className="col-start-3 flex justify-end">
          <NavbarAuth />
        </div>
      </div>
    </header>
  )
}
