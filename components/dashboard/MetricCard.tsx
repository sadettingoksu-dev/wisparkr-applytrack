import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  icon: LucideIcon
}

/**
 * paytr panel "özet kartı" (İşlemler/Grafikler tarzı) — büyük değer üstte,
 * etiket altta, sağ üstte ikon rozeti. Props sözleşmesi korunur (label/value/icon);
 * dashboard ve demo sayfaları otomatik yararlanır.
 */
export function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-lg hover:shadow-purple-200/50">
      {/* üst accent şeridi */}
      <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-fuchsia-400 opacity-70" aria-hidden />
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-transform group-hover:scale-105">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}
