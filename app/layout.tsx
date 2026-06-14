import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ApplyTrack — AI Destekli İş Başvuru Yönetimi',
  description:
    'İş başvurularını takip et, AI ile CV uyum skoru al, mülakatlara AI desteğiyle hazırlan.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="min-h-screen bg-white text-slate-800 antialiased">
        {children}
      </body>
    </html>
  )
}
