'use client'

import { langLevelToScore } from '@/lib/cvTemplates'
import { useI18n } from '@/components/i18n/I18nProvider'

/**
 * Kademeli dil seviyesi seçici (ses seviyesi mantığı).
 *
 * Neden serbest metin değil: seviye eskiden düz bir input'tu, kullanıcı ne
 * isterse yazıyordu. PDF motoru (`langLevelToScore`) o metni regex ile 1–5
 * puana çeviriyor; eşleşmeyen her şey sessizce 4'e düşüyordu.
 *
 * Neden hâlâ string olarak saklanıyor: `cvLanguageSchema.level` string ve
 * `langLevelToScore` tek doğruluk kaynağı. Sayıya çevirmek şemayı, mevcut
 * kullanıcı verisini ve PDF motorunu birden kırardı.
 *
 * Mevcut serbest-metin veriler ("C1", "Advanced", "çok iyi"...) aynı
 * fonksiyondan geçirilerek en yakın kademeye oturur — hiçbir veri kaybolmaz.
 *
 * DİKKAT: etiketler i18n'den gelir ve HER dilde CEFR kodu taşımalıdır,
 * yoksa langLevelToScore yanlış kademeye düşürür (bkz. lib/i18n.ts).
 */

/** Puanlar langLevelToScore'un ürettiği değerlerle birebir eşleşir. */
const LEVELS = [
  { score: 2, key: 'langLevelBasic' },
  { score: 3, key: 'langLevelMid' },
  { score: 4, key: 'langLevelAdvanced' },
  { score: 5, key: 'langLevelNative' },
] as const

export function LanguageLevelPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (level: string) => void
}) {
  const { t } = useI18n()
  // Boş = henüz seçilmemiş. Doluysa mevcut metni puana çevirip eşleştir.
  const score = value.trim() ? langLevelToScore(value) : 0
  const activeIndex = LEVELS.findIndex((l) => l.score === score)

  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1" role="group" aria-label={t.cvBuilder.langLevel}>
        {LEVELS.map((lvl, i) => {
          const filled = activeIndex >= 0 && i <= activeIndex
          return (
            <button
              key={lvl.key}
              type="button"
              onClick={() => onChange(t.cvBuilder[lvl.key])}
              aria-pressed={i === activeIndex}
              title={t.cvBuilder[lvl.key]}
              className={
                'h-2.5 flex-1 rounded-full transition-colors ' +
                (filled ? 'bg-purple-600' : 'bg-slate-200 hover:bg-purple-200')
              }
            />
          )
        })}
      </div>
      <span className="w-32 shrink-0 truncate text-xs text-slate-500">
        {activeIndex >= 0 ? t.cvBuilder[LEVELS[activeIndex].key] : t.cvBuilder.langLevel}
      </span>
    </div>
  )
}
