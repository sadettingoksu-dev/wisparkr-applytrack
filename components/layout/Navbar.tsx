import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { APP_NAME } from '@/utils/constants'

export function Navbar() {
  return (
    <header className="border-b border-slate-100 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-purple-600">
          {APP_NAME}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-500 md:flex">
          <Link href="/#features" className="hover:text-slate-800">
            Özellikler
          </Link>
          <Link href="/pricing" className="hover:text-slate-800">
            Fiyatlandırma
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-800">
            Giriş Yap
          </Link>
          <Link href="/signup">
            <Button>Ücretsiz Başla</Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
