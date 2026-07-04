'use client'

import type { VoiceGender } from '@/lib/speech'

/**
 * Gerçek illüstrasyonlu mülakat koçu avatarı (eski, acemi görünen SVG yerine).
 * - Kadın/erkek görseli seçili sese göre değişir (public/interview/*).
 * - Görsel dairenin içinde yüze odaklanacak şekilde kırpılır.
 * - Koç konuşurken hafif baş/omuz canlanması (iv-speak-bob) + dairenin alt
 *   yayında ÇIKAN SESE göre hareket eden SİMETRİK ses dalgası çubukları görünür,
 *   böylece "ağzı oynuyor / konuşuyor" hissi verir.
 *
 * Not: Görseller statik illüstrasyon olduğu için ağzın kare kare hareketi (rig)
 * mümkün değil; bunun yerine konuşma süresince simetrik ses dalgası + canlanma
 * animasyonu kullanılır.
 */

const AV_KEYFRAMES = `
@keyframes iv-speak-bob{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-1.5%) scale(1.015)}}
@keyframes iv-wavebar{0%,100%{transform:scaleY(0.28)}50%{transform:scaleY(1)}}
@keyframes iv-speakglow{0%,100%{opacity:0.35}50%{opacity:0.75}}
`

// Dairenin altında yüze/ağza hizalı, ortadan simetrik dalga çubukları.
const WAVE_BARS = [
  { h: 0.34, dur: '0.42s', delay: '0.00s' },
  { h: 0.54, dur: '0.30s', delay: '0.12s' },
  { h: 0.78, dur: '0.24s', delay: '0.06s' },
  { h: 1.0, dur: '0.20s', delay: '0.00s' },
  { h: 0.78, dur: '0.24s', delay: '0.06s' },
  { h: 0.54, dur: '0.30s', delay: '0.12s' },
  { h: 0.34, dur: '0.42s', delay: '0.00s' },
]

// Her cinsiyet görseli için dairede yüzü ortalayan odak noktası ve yakınlaştırma.
const FOCUS: Record<VoiceGender, { image: string; size: string; position: string }> = {
  female: {
    image: '/interview/coach-female.jpeg',
    size: '240%',
    position: '90% 10%',
  },
  male: {
    image: '/interview/coach-male.png',
    size: '220%',
    position: '47% 10%',
  },
}

export function InterviewAvatar({
  speaking,
  gender,
  size = 200,
}: {
  speaking: boolean
  gender: VoiceGender
  size?: number
}) {
  const focus = FOCUS[gender]
  const barGap = Math.max(1, Math.round(size * 0.018))
  const barWidth = Math.max(2, Math.round(size * 0.03))
  const waveHeight = size * 0.16

  return (
    <div
      role="img"
      aria-label={gender === 'female' ? 'Kadın mülakat koçu' : 'Erkek mülakat koçu'}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: '#1a1033',
      }}
    >
      <style>{AV_KEYFRAMES}</style>

      {/* koç görseli — yüze odaklı kırpım */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${focus.image})`,
          backgroundSize: focus.size,
          backgroundPosition: focus.position,
          backgroundRepeat: 'no-repeat',
          transformOrigin: '50% 40%',
          animation: speaking ? 'iv-speak-bob 0.5s ease-in-out infinite' : undefined,
        }}
      />

      {/* konuşurken alttan yumuşak mor parıltı */}
      {speaking && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '46%',
            background:
              'linear-gradient(to top, rgba(124,58,237,0.55) 0%, rgba(124,58,237,0.12) 60%, rgba(124,58,237,0) 100%)',
            animation: 'iv-speakglow 0.6s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* SİMETRİK ses dalgası — çıkan sese göre oynayan ağız/konuşma göstergesi */}
      {speaking && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: `${Math.round(size * 0.08)}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: barGap,
            pointerEvents: 'none',
          }}
        >
          {WAVE_BARS.map((b, i) => (
            <span
              key={i}
              style={{
                display: 'block',
                width: barWidth,
                height: waveHeight * b.h,
                borderRadius: barWidth,
                background: 'linear-gradient(180deg,#f5d0fe,#a855f7)',
                boxShadow: '0 0 6px rgba(168,85,247,0.8)',
                transformOrigin: 'center',
                animation: `iv-wavebar ${b.dur} ease-in-out infinite`,
                animationDelay: b.delay,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
