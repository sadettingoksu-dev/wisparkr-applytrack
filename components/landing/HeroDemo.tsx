import { Sparkles } from 'lucide-react'

/**
 * Hero'nun sağ üstündeki "video gibi" ürün demosu — gerçek video dosyası YOK.
 * Sahte bir uygulama penceresi tamamen CSS animasyonlarıyla canlandırılır
 * (kartların belirmesi, üzerinden geçen tarama çizgisi, dolan AI ilerleme çubuğu).
 * Saf sunucu bileşeni: yalnızca metinleri prop olarak alır, JS state tutmaz.
 */
export function HeroDemo({
  labels,
}: {
  labels: { title: string; interview: string; offer: string; pending: string; aiWriting: string }
}) {
  const rows = [
    { company: 'Google', status: labels.interview, color: 'bg-amber-100 text-amber-700' },
    { company: 'Spotify', status: labels.offer, color: 'bg-emerald-100 text-emerald-700' },
    { company: 'Meta', status: labels.pending, color: 'bg-slate-100 text-slate-600' },
  ]

  return (
    <div className="wisparkr-float relative w-full max-w-md">
      {/* Arka parıltı */}
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-tr from-purple-300/40 via-fuchsia-200/30 to-transparent blur-2xl" />

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-purple-300/30">
        {/* Pencere üst çubuğu */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>

        {/* Gövde */}
        <div className="space-y-3 p-5">
          <p className="text-sm font-semibold text-slate-900">{labels.title}</p>

          {/* Başvuru listesi + üzerinden geçen tarama çizgisi */}
          <div className="relative space-y-2 overflow-hidden rounded-xl border border-slate-100 p-2">
            <span className="wisparkr-demo-scan pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-purple-400/25 to-transparent" />
            {rows.map((r, i) => (
              <div
                key={r.company}
                className="wisparkr-fade-up flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                style={{ animationDelay: `${i * 0.18}s` }}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-xs font-bold text-slate-500 ring-1 ring-slate-200">
                    {r.company[0]}
                  </span>
                  <span className="text-xs font-medium text-slate-700">{r.company}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.color}`}>{r.status}</span>
              </div>
            ))}
          </div>

          {/* AI ön yazı — dolan ilerleme çubuğu */}
          <div className="rounded-xl border border-purple-100 bg-purple-50/60 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-purple-700">
              <Sparkles className="wisparkr-demo-pop h-3.5 w-3.5" />
              {labels.aiWriting}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-purple-100">
              <div className="wisparkr-demo-progress h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
