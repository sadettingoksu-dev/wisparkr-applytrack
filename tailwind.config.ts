import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

// --- Tasarım token'ları -------------------------------------------------------
// Tek görsel kaynak. Ham Tailwind paleti yerine türetilmiş bir marka rengi
// kullanılır; `purple` ölçeği marka ile EZİLİR ki mevcut `*-purple-*` sınıfları
// tek seferde yükselsin (kod churn'ü olmadan). İkincil vurgu: fuchsia.
const brand = {
  50: '#f5f3ff',
  100: '#ece8ff',
  200: '#dad4ff',
  300: '#bfb0ff',
  400: '#a081fb',
  500: '#8654f5',
  600: '#7538e8', // primary
  700: '#6327c9',
  800: '#5322a3',
  900: '#452083',
  950: '#2a0f5a',
}

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', 'var(--font-sans)', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand,
        // Mevcut kod tabanı `purple-*` üzerine standart; marka ile eşleyerek
        // tüm uygulamayı tek noktadan rafine ederiz.
        purple: brand,
      },
      boxShadow: {
        // Düz shadow-md yerine katmanlı, renk-tonlu, düşük opaklık gölgeler.
        card: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -12px rgba(16,24,40,0.10)',
        elevated: '0 4px 6px -2px rgba(16,24,40,0.06), 0 12px 24px -8px rgba(16,24,40,0.10)',
        floating: '0 8px 12px -4px rgba(16,24,40,0.08), 0 24px 48px -12px rgba(16,24,40,0.18)',
        brand: '0 10px 30px -10px rgba(117,56,232,0.45)',
        'brand-sm': '0 4px 14px -6px rgba(117,56,232,0.40)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}

export default config
