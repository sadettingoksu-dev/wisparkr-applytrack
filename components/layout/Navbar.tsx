import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME } from '@/utils/constants'

export function Navbar() {
  return (
    <header className="rounded-b-[2rem] bg-neutral-900 shadow-lg shadow-black/60">
      <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-dark.png" alt="Wisparkr" width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold text-amber-500">{APP_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-white/50 md:flex ml-8">
          <Link href="/#features" className="hover:text-white">Özellikler</Link>
          <Link href="/pricing" className="hover:text-white">Fiyatlandırma</Link>
        </nav>
        <div className="ml-auto">
          <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white">
            Giriş Yap
          </Link>
        </div>
      </div>
    </header>
  )
}
