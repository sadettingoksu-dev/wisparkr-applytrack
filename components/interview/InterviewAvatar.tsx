'use client'

import type { VoiceGender } from '@/lib/speech'

/**
 * İnsan görünümlü, canlı mülakatçı avatarı (robot yerine).
 * - Gözler periyodik kırpar (iv-blink)
 * - AI konuşurken ağız hareket eder, dudak senkronu hissi verir (iv-talk)
 * - Kadın/erkek varyantı seçili sese göre değişir
 * Tamamen SVG + CSS; dış bağımlılık/ücretli servis yok.
 */

const AV_KEYFRAMES = `
@keyframes iv-blink{0%,92%,100%{transform:scaleY(1)}96%{transform:scaleY(0.06)}}
@keyframes iv-talk{0%,100%{transform:scaleY(0.32)}50%{transform:scaleY(1)}}
@keyframes iv-browspeak{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.6px)}}
`

export function InterviewAvatar({
  speaking,
  gender,
  size = 200,
}: {
  speaking: boolean
  gender: VoiceGender
  size?: number
}) {
  const female = gender === 'female'
  const eyeStyle = {
    transformBox: 'fill-box' as const,
    transformOrigin: 'center' as const,
    animation: 'iv-blink 5.2s ease-in-out infinite',
  }
  const browStyle = speaking
    ? {
        transformBox: 'fill-box' as const,
        transformOrigin: 'center' as const,
        animation: 'iv-browspeak 0.5s ease-in-out infinite',
      }
    : undefined

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role="img"
      aria-label={female ? 'Kadın mülakatçı' : 'Erkek mülakatçı'}
    >
      <style>{AV_KEYFRAMES}</style>
      <defs>
        <radialGradient id="iv-bg" cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#efe2ff" />
          <stop offset="55%" stopColor="#d8c2ff" />
          <stop offset="100%" stopColor="#b794ec" />
        </radialGradient>
        <linearGradient id="iv-skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd9bf" />
          <stop offset="100%" stopColor="#f3b893" />
        </linearGradient>
        <linearGradient id="iv-cloth" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={female ? '#6d28d9' : '#312e81'} />
          <stop offset="100%" stopColor={female ? '#4c1d95' : '#1e1b4b'} />
        </linearGradient>
        <clipPath id="iv-clip">
          <circle cx="100" cy="100" r="100" />
        </clipPath>
      </defs>

      <g clipPath="url(#iv-clip)">
        {/* arka plan */}
        <rect x="0" y="0" width="200" height="200" fill="url(#iv-bg)" />

        {/* omuzlar / kıyafet */}
        <path
          d="M30 200 C32 162 60 150 100 150 C140 150 168 162 170 200 Z"
          fill="url(#iv-cloth)"
        />
        {/* yaka */}
        <path
          d="M82 152 L100 172 L118 152 L108 148 L100 156 L92 148 Z"
          fill={female ? '#ede9fe' : '#e0e7ff'}
          opacity="0.9"
        />

        {/* boyun */}
        <path d="M86 132 C86 148 114 148 114 132 L114 120 L86 120 Z" fill="#eaa982" />

        {/* saç (arka) */}
        {female ? (
          <path
            d="M48 96 C44 50 70 28 100 28 C130 28 156 50 152 96 C152 120 150 138 146 150 L150 96 C150 60 128 40 100 40 C72 40 50 60 50 96 L54 150 C50 138 48 120 48 96 Z"
            fill="#4a2c1a"
          />
        ) : (
          <path d="M56 92 C52 52 74 32 100 32 C126 32 148 52 144 92 L142 86 C140 56 124 44 100 44 C76 44 60 56 58 86 Z" fill="#2e2014" />
        )}

        {/* yüz */}
        <ellipse cx="100" cy="94" rx="44" ry="50" fill="url(#iv-skin)" />

        {/* kulaklar */}
        <ellipse cx="57" cy="98" rx="7" ry="10" fill="#f0b08a" />
        <ellipse cx="143" cy="98" rx="7" ry="10" fill="#f0b08a" />
        {female && <circle cx="57" cy="110" r="2.4" fill="#f5d76e" />}
        {female && <circle cx="143" cy="110" r="2.4" fill="#f5d76e" />}

        {/* saç (ön) */}
        {female ? (
          <path
            d="M56 92 C54 54 76 34 100 34 C124 34 146 54 144 92 C140 74 128 62 116 60 C112 70 92 72 84 62 C72 66 60 76 56 92 Z"
            fill="#4a2c1a"
          />
        ) : (
          <path
            d="M58 86 C60 58 76 46 100 46 C124 46 140 58 142 86 C134 72 122 66 100 66 C78 66 66 72 58 86 Z"
            fill="#2e2014"
          />
        )}

        {/* kaşlar */}
        <g style={browStyle}>
          <path d="M74 80 Q84 74 94 79" stroke="#3a2414" strokeWidth="3.2" fill="none" strokeLinecap="round" />
          <path d="M106 79 Q116 74 126 80" stroke="#3a2414" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        </g>

        {/* gözler (kırpma) */}
        <g style={eyeStyle}>
          <ellipse cx="84" cy="92" rx="8" ry="6.5" fill="#fff" />
          <circle cx="85" cy="92.5" r="3.6" fill="#5b3b1a" />
          <circle cx="85" cy="92.5" r="1.7" fill="#1a0f06" />
          <circle cx="86.4" cy="91" r="1" fill="#fff" />
        </g>
        <g style={eyeStyle}>
          <ellipse cx="116" cy="92" rx="8" ry="6.5" fill="#fff" />
          <circle cx="115" cy="92.5" r="3.6" fill="#5b3b1a" />
          <circle cx="115" cy="92.5" r="1.7" fill="#1a0f06" />
          <circle cx="116.4" cy="91" r="1" fill="#fff" />
        </g>

        {/* burun */}
        <path d="M100 98 L96 110 Q100 113 104 110 Z" fill="#e8a07a" opacity="0.85" />

        {/* yanak allığı */}
        <ellipse cx="76" cy="108" rx="7" ry="4" fill="#f6a98a" opacity="0.45" />
        <ellipse cx="124" cy="108" rx="7" ry="4" fill="#f6a98a" opacity="0.45" />

        {/* ağız */}
        {speaking ? (
          <g
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: 'iv-talk 0.3s ease-in-out infinite',
            }}
          >
            <ellipse cx="100" cy="121" rx="11" ry="8.5" fill="#7a2433" />
            <path d="M91 117 Q100 114 109 117 L109 119 Q100 117 91 119 Z" fill="#fff" />
            <ellipse cx="100" cy="126" rx="5" ry="3" fill="#d9536b" />
          </g>
        ) : (
          <path
            d="M89 119 Q100 127 111 119"
            stroke="#a13b4a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {female && (
          <path d="M50 96 C48 124 52 140 58 152 L52 150 C46 138 44 120 46 96 Z" fill="#4a2c1a" />
        )}
        {female && (
          <path d="M150 96 C152 124 148 140 142 152 L148 150 C154 138 156 120 154 96 Z" fill="#4a2c1a" />
        )}
      </g>
    </svg>
  )
}
