import type { ReactNode } from 'react'
import clsx from 'clsx'

/**
 * Satır bazlı ayarlar düzeni primitifleri. Ayar sayfası; kart yığını yerine
 * gruplanmış, ince çizgilerle ayrılmış satır listeleri kullanır (modern uygulama
 * ayarları gibi). SettingsGroup > (SettingsRow | ResultRow) direkt çocuklarıdır;
 * divide-y aralarına otomatik çizgi koyar.
 */
export function SettingsGroup({
  title,
  children,
  tone = 'default',
}: {
  title?: string
  children: ReactNode
  tone?: 'default' | 'danger'
}) {
  return (
    <section className="space-y-2">
      {title && (
        <h2 className={clsx('px-1 text-xs font-semibold uppercase tracking-wide', tone === 'danger' ? 'text-red-500' : 'text-slate-400')}>
          {title}
        </h2>
      )}
      <div
        className={clsx(
          'divide-y overflow-hidden rounded-2xl border bg-white shadow-sm',
          tone === 'danger' ? 'divide-red-100 border-red-200' : 'divide-slate-100 border-slate-200'
        )}
      >
        {children}
      </div>
    </section>
  )
}

/** Tek ayar satırı: solda başlık/açıklama, sağda değer veya aksiyon. */
export function SettingsRow({
  label,
  description,
  children,
  alignTop = false,
}: {
  label?: ReactNode
  description?: ReactNode
  children?: ReactNode
  alignTop?: boolean
}) {
  return (
    <div className={clsx('flex flex-wrap justify-between gap-x-4 gap-y-2 px-4 py-3.5 sm:flex-nowrap', alignTop ? 'items-start' : 'items-center')}>
      {(label || description) && (
        <div className="min-w-0">
          {label && <div className="text-sm font-medium text-slate-800">{label}</div>}
          {description && <div className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</div>}
        </div>
      )}
      {children && <div className="flex min-w-0 shrink-0 items-center gap-2">{children}</div>}
    </div>
  )
}

/**
 * Bir aksiyon (Oluştur/Yenile) sonrası ALTINDA beliren sonuç satırı.
 * value verilirse monospace olarak gösterilir; sağ tarafa (children) kopyala vb. konur.
 */
export function ResultRow({ value, children }: { value?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2.5">
      {value !== undefined && <code className="min-w-0 flex-1 truncate font-mono text-xs text-slate-600">{value}</code>}
      {children}
    </div>
  )
}
