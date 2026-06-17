import Link from 'next/link'
import Image from 'next/image'
import { APP_NAME } from '@/utils/constants'

export function Navbar() {
  return (
    <header className="rounded-b-[2rem] bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Wisparkr" width={32} height={32} className="rounded-lg" />
          <span className="text-xl font-bold text-purple-600">{APP_NAME}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-500 md:flex ml-8">
          <Link href="/#features" className="hover:text-slate-800">Özellikler</Link>
          <Link href="/pricing" className="hover:text-slate-800">Fiyatlandırma</Link>
        </nav>
        <div className="ml-auto">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-800">
            Giriş Yap
          </Link>
        </div>
      </div>
    </header>
  )
}
