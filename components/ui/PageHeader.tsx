import { PageInfo, type PageKey } from '@/components/ui/PageInfo'

/**
 * Panel sayfalarının ortak başlığı.
 *
 * Daha önce 16 sayfanın her biri kendi <h1>'ini yazıyordu; çoğu aynı sınıfları
 * tekrarlıyor, bir kısmı sapıyordu (3 sayfada başlık hiç yoktu, Ayarlar
 * text-lg kullanıyordu, bazı sayfalar başlığı iki render dalında
 * tekrarlıyordu). Tek kaynak burası.
 *
 * Sunucu bileşenlerinden çağrılabilir; PageInfo kendi içinde 'use client'.
 */
export function PageHeader({
  title,
  subtitle,
  infoPage,
  actions,
}: {
  title: string
  subtitle?: string
  /** Sağdaki "i" butonu — anahtar i18n'deki pageInfo sözlüğünden gelir. */
  infoPage?: PageKey
  /** Başlığın sağındaki butonlar; PageInfo'dan sonra dizilir. */
  actions?: React.ReactNode
}) {
  const hasRight = Boolean(infoPage) || Boolean(actions)

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {hasRight && (
        <div className="flex shrink-0 items-center gap-2">
          {infoPage && <PageInfo page={infoPage} />}
          {actions}
        </div>
      )}
    </div>
  )
}
