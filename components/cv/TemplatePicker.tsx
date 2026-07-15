'use client'

import { Check } from 'lucide-react'
import { useI18n } from '@/components/i18n/I18nProvider'
import { TemplateThumb } from '@/components/cv/TemplateThumb'
import {
  CV_TEMPLATE_IDS,
  TEMPLATES,
  TEMPLATE_CATEGORY_ORDER,
  type CvTemplate,
} from '@/lib/cvTemplates'
import type { CvData } from '@/lib/cv'

export type { CvTemplate }

/**
 * Şablon seçici.
 *
 * Kartlar artık sabit PNG değil, kullanıcının KENDİ verisiyle çizilen HTML
 * replikaları (bkz. TemplateThumb) — eski PNG'lerde herkese "Elif Yılmaz"
 * görünüyordu.
 *
 * Düzen: 9 kart tek ekrana sığar. Eskiden `grid-cols-2 sm:grid-cols-3` +
 * yükseklik sınırsız tam A4 oranı vardı → ~1500px, sayfa kaydırıyordu.
 */
export function TemplatePicker({
  value,
  onChange,
  cv,
  showHeading = true,
}: {
  value: CvTemplate
  onChange: (t: CvTemplate) => void
  /**
   * Canlı CV verisi — kartlarda kullanıcının kendi adı/fotoğrafı görünür.
   * Opsiyonel: ön yazı / uyarlanmış CV / Belgelerim yüzeylerinde elde
   * yapılandırılmış CV yok; orada kart yalnızca düzeni ve rengi aktarır.
   */
  cv?: CvData
  /** Sihirbazda adımın kendi başlığı zaten var → tekrarı kapat. */
  showHeading?: boolean
}) {
  const { t } = useI18n()
  const names = t.templatePicker as unknown as Record<string, string>
  const categories = (t.templatePicker.categories ?? {}) as Record<string, string>
  // Tek kategori varken etiketi yazmak saf gürültü (ve dikey yer yiyor).
  const showCategory = TEMPLATE_CATEGORY_ORDER.length > 1

  return (
    <div className="space-y-2">
      {showHeading && <p className="text-sm font-semibold text-slate-900">{t.templatePicker.heading}</p>}

      {TEMPLATE_CATEGORY_ORDER.map((cat) => {
        const ids = CV_TEMPLATE_IDS.filter((id) => TEMPLATES[id].category === cat)
        if (ids.length === 0) return null
        return (
          <div key={cat} className="space-y-2">
            {showCategory && (
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{categories[cat] ?? cat}</p>
            )}
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {ids.map((id) => {
                const selected = value === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChange(id)}
                    className={`group relative rounded-lg border-2 p-1.5 text-left transition-all ${
                      selected
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-purple-300 hover:shadow-sm'
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-1 top-1 z-10 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-white shadow">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                    {/* Sabit yükseklik: A4 oranı yükseklik sınırsız bırakılınca
                        kartlar ~500px'e çıkıyor ve 9 şablon tek ekrana sığmıyordu. */}
                    <TemplateThumb id={id} cv={cv} height={158} />
                    <p className={`mt-1 truncate text-center text-[11px] font-medium ${selected ? 'text-purple-700' : 'text-slate-600'}`}>
                      {names[id] ?? id}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
