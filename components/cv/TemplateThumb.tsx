'use client'

import { buildSurfaces, TEMPLATES, type CvTemplate } from '@/lib/cvTemplates'
import type { CvData } from '@/lib/cv'

/**
 * Şablon kartı — kullanıcının KENDİ verisiyle küçük bir A4 replikası.
 *
 * Neden PNG değil: kartlar eskiden build zamanında üretilmiş sabit
 * public/cv-templates/<id>.png dosyalarıydı ve içlerinde "Elif Yılmaz" gömülüydü.
 * Kullanıcı kendi adını göremiyordu.
 *
 * Neden 9 tane gerçek PDF değil: tek sayfada 9 PDF render'ı yavaş ve pahalı.
 * Gerçek PDF önizlemesi zaten bir sonraki adımda (PdfPreview) var — kesin
 * doğrulama orada yapılıyor. Kart yalnızca DÜZEN + RENK + İSİM aktarır.
 *
 * Drift yok: renkler `buildSurfaces` ile PDF motorunun kullandığı ile AYNI
 * fonksiyondan türetilir (lib/cvTemplates.ts). Şablon token'ı değişince kart da
 * PDF de birlikte değişir.
 */
export function TemplateThumb({ id, cv, height }: { id: CvTemplate; cv?: CvData; height?: number }) {
  const t = TEMPLATES[id]
  const { side, main } = buildSurfaces(t)
  const sideW = (t.sideWidth ?? 0.34) * 100
  const onRight = t.sidebarSide === 'right'
  const nameIn = t.nameIn ?? 'main'

  const name = cv?.personal.fullName.trim() ?? ''
  const headline = cv?.personal.headline.trim() ?? ''
  const photo = cv?.personal.photo ?? ''
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toLocaleUpperCase('tr-TR'))
    .join('')

  const radius = t.photoShape === 'circle' ? '50%' : t.photoShape === 'rounded' ? '10%' : '2px'

  const Photo = (
    <div
      className="mb-1 overflow-hidden"
      style={{
        width: t.photoShape === 'circle' ? '52%' : '100%',
        aspectRatio: t.photoShape === 'circle' ? '1 / 1' : '4 / 5',
        margin: t.photoShape === 'circle' ? '0 auto 4px' : undefined,
        borderRadius: radius,
        background: photo ? undefined : side.dark ? 'rgba(255,255,255,0.12)' : `${t.accent}22`,
        border: t.photoBorder ? `1px solid ${t.photoBorder}` : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="h-full w-full object-cover" />
      ) : (
        <span style={{ fontSize: 7, fontWeight: 700, color: t.accent }}>{initials}</span>
      )}
    </div>
  )

  /** Bölüm başlığı + birkaç sahte satır — düzeni aktarır, metni değil. */
  const Section = ({ surf, lines = 3 }: { surf: typeof side; lines?: number }) => (
    <div className="mb-1.5">
      <div style={{ height: 2, width: '46%', background: surf.heading, borderRadius: 1, marginBottom: 2 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          style={{
            height: 1.5,
            width: `${92 - i * 14}%`,
            background: surf.text,
            opacity: 0.45,
            borderRadius: 1,
            marginBottom: 1.5,
          }}
        />
      ))}
    </div>
  )

  const NameBlock = ({ surf }: { surf: typeof side }) => (
    <div className="mb-1">
      <p
        className="truncate font-bold leading-tight"
        style={{
          fontSize: 6.5,
          color: t.nameColor ?? (surf.dark ? '#ffffff' : t.accent),
        }}
      >
        {name || 'Ad Soyad'}
      </p>
      {!!headline && (
        <p className="truncate" style={{ fontSize: 4.5, color: t.headlineColor ?? surf.accent }}>
          {headline}
        </p>
      )}
    </div>
  )

  const SideCol = (
    <div style={{ width: `${sideW}%`, background: side.bg, padding: '5px 4px' }}>
      {Photo}
      {nameIn === 'sidebar' && <NameBlock surf={side} />}
      <Section surf={side} lines={2} />
      <Section surf={side} lines={3} />
    </div>
  )

  const MainCol = (
    <div style={{ width: `${100 - sideW}%`, background: main.bg, padding: '5px 5px' }}>
      {nameIn === 'main' && <NameBlock surf={main} />}
      {nameIn === 'band' && (
        <div style={{ background: t.accent, margin: '-5px -5px 4px', padding: '4px 5px' }}>
          <p className="truncate font-bold leading-tight" style={{ fontSize: 6.5, color: '#fff' }}>
            {name || 'Ad Soyad'}
          </p>
        </div>
      )}
      <Section surf={main} lines={3} />
      <Section surf={main} lines={4} />
    </div>
  )

  return (
    <div
      className="mx-auto flex overflow-hidden rounded-md ring-1 ring-slate-200 dark:ring-slate-700"
      // height verilirse genişlik A4 oranından türer ve kart ortalanır —
      // böylece 9 kart tek ekrana sığar.
      style={height ? { height, aspectRatio: '210 / 297' } : { aspectRatio: '210 / 297' }}
    >
      {onRight ? (
        <>
          {MainCol}
          {SideCol}
        </>
      ) : (
        <>
          {SideCol}
          {MainCol}
        </>
      )}
    </div>
  )
}
