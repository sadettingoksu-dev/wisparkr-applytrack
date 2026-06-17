'use client'

import { Button } from '@/components/ui/Button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-amber-500/10 px-6 text-center">
      <h1 className="text-2xl font-bold text-red-500">Bir şeyler ters gitti</h1>
      <p className="max-w-md text-sm text-white/50">{error.message}</p>
      <Button onClick={reset}>Tekrar Dene</Button>
    </div>
  )
}
