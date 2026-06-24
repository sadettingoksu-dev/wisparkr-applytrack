import Link from 'next/link'
import { Clock } from 'lucide-react'
import { getServerDict } from '@/lib/i18n-server'

/**
 * Shown on a public CV link whose owner is on the free plan and whose 7-day
 * window has passed. Kept professional so it doesn't hurt the candidate's
 * impression — the upgrade pressure stays on the owner.
 */
export function ExpiredCv() {
  const t = getServerDict()
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-100 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-lg font-bold text-neutral-900">{t.expiredCv.title}</h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t.expiredCv.desc}
        </p>
        <div className="mt-6 border-t border-neutral-100 pt-5">
          <p className="text-xs text-neutral-400">{t.expiredCv.yours}</p>
          <Link
            href="/pricing"
            className="mt-2 inline-block rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            {t.expiredCv.makePermanent}
          </Link>
        </div>
        <Link href="/" className="mt-5 block text-xs text-neutral-400 hover:text-neutral-600">
          Wisparkr
        </Link>
      </div>
    </div>
  )
}
