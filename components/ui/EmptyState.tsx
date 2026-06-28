import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  ctaLabel?: string
  ctaHref?: string
}

/** Boş listeler için görsel boş durum: ikon + başlık + açıklama + opsiyonel CTA. */
export function EmptyState({ icon: Icon, title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-5 inline-block rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
