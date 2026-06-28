import { Sparkles } from 'lucide-react'
import type { Dictionary } from '@/lib/i18n'

/**
 * "Nasıl çalışır" bölümündeki ürün vitrini — statik ekran görüntüsü yerine
 * i18n metniyle çalışan sahte arayüz maketleri. Böylece dil değişince
 * içerik de OTOMATİK çevrilir (resimler dil bağımsızdı, sorun buydu).
 * Saf sunucu bileşeni: sadece sözlüğü prop alır.
 */
export function ShowcaseMock({ index, t }: { index: number; t: Dictionary }) {
  if (index === 0) {
    // Adım 1 — İlanı ekle: yapıştırılan link → AI doldurma
    return (
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-[11px] font-medium text-slate-500">{t.newApp.urlLabel}</p>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="truncate text-xs text-slate-600">linkedin.com/jobs/view/39204…</span>
            <span className="shrink-0 rounded-md bg-purple-600 px-2 py-0.5 text-[10px] font-semibold text-white">
              {t.newApp.fill}
            </span>
          </div>
        </div>
        <div className="space-y-2 rounded-xl border border-purple-100 bg-purple-50/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-purple-700">
            <Sparkles className="wisparkr-demo-pop h-3.5 w-3.5" />
            {t.newApp.aiFilledHint}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-white p-2 ring-1 ring-slate-100">
              <p className="text-[10px] text-slate-400">{t.newApp.companyLabel}</p>
              <p className="text-xs font-semibold text-slate-800">Google</p>
            </div>
            <div className="rounded-lg bg-white p-2 ring-1 ring-slate-100">
              <p className="text-[10px] text-slate-400">{t.newApp.positionLabel}</p>
              <p className="text-xs font-semibold text-slate-800">Frontend Developer</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (index === 1) {
    // Adım 2 — CV uyum skoru + beceriler
    const chip = 'rounded-full px-2 py-0.5 text-[10px] font-medium'
    return (
      <div className="flex items-center gap-4">
        <div
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'conic-gradient(#a855f7 82%, #ede9fe 0)' }}
        >
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white">
            <span className="text-lg font-bold text-purple-700">82%</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          <p className="text-xs font-semibold text-slate-800">{t.fitScore.title}</p>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-emerald-600">{t.skillsGap.matched}</p>
            <div className="flex flex-wrap gap-1">
              {['React', 'TypeScript', 'Next.js'].map((s) => (
                <span key={s} className={`${chip} bg-emerald-100 text-emerald-700`}>{s}</span>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-amber-600">{t.skillsGap.missing}</p>
            <div className="flex flex-wrap gap-1">
              {['Docker', 'GraphQL'].map((s) => (
                <span key={s} className={`${chip} bg-amber-100 text-amber-700`}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Adım 3 — Kanban takip
  const cols: { label: string; cards: { c: string; score: number }[]; dot: string }[] = [
    { label: t.status.pending, dot: 'bg-slate-300', cards: [{ c: 'Meta', score: 71 }] },
    { label: t.status.interview, dot: 'bg-amber-400', cards: [{ c: 'Google', score: 88 }] },
    { label: t.status.offer, dot: 'bg-emerald-400', cards: [{ c: 'Spotify', score: 93 }] },
  ]
  return (
    <div className="grid grid-cols-3 gap-2">
      {cols.map((col) => (
        <div key={col.label} className="space-y-2 rounded-xl bg-slate-50 p-2">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${col.dot}`} />
            <span className="truncate text-[10px] font-semibold text-slate-500">{col.label}</span>
          </div>
          {col.cards.map((card) => (
            <div key={card.c} className="space-y-1.5 rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[9px] font-bold text-slate-500">
                  {card.c[0]}
                </span>
                <span className="truncate text-[11px] font-medium text-slate-700">{card.c}</span>
              </div>
              <span className="inline-block rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700">
                {t.board.matchLabel.replace('{score}', String(card.score))}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
