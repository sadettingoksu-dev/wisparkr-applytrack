import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-amber-500/10 px-6 text-center">
      <h1 className="text-4xl font-bold text-amber-500">404</h1>
      <p className="text-white/50">Aradığın sayfa bulunamadı.</p>
      <Link href="/">
        <Button>Ana Sayfaya Dön</Button>
      </Link>
    </div>
  )
}
