import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/components/i18n/I18nProvider'
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/i18n'

// Gövde metni — temiz, yüksek okunabilirlik. latin-ext → Türkçe (ş/ğ/İ/ı) tam destek.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
})

// Başlıklar — karakterli, modern grotesk. Türkçe glyph eksikse gövde fontuna
// (var stack ile) sorunsuz düşer; globals.css h1–h4 kuralına bak.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Wisparkr — AI Destekli İş Başvuru Yönetimi',
  description:
    'İş başvurularını takip et, AI ile CV uyum skoru al, mülakatlara AI desteğiyle hazırlan.',
  icons: {
    icon: '/favicon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = normalizeLocale(cookies().get(LOCALE_COOKIE)?.value)
  return (
    <html lang={locale} className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        {/* Tema flash'ını önle: boyamadan önce localStorage/sistem tercihine göre
            <html>'e 'dark' sınıfını ekle. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <I18nProvider locale={locale}>{children}</I18nProvider>
      </body>
    </html>
  )
}
