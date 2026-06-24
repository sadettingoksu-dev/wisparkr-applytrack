import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-purple-50 px-6 text-center">
      <h1 className="text-4xl font-bold text-purple-600">404</h1>
      <p className="text-slate-500">Aradığın sayfa bulunamadı.</p>
      <Link href="/">
        <Button>Ana Sayfaya Dön</Button>
      </Link>
    </div>
  )
}
