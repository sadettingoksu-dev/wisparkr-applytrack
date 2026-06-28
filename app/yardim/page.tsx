import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HelpCenter } from '@/components/help/HelpCenter'

export const metadata = {
  title: 'Yardım Merkezi — Wisparkr',
  description: 'Wisparkr’ı kullanmaya başlamak için adım adım rehberler ve sık sorulan sorular.',
}

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <HelpCenter />
      </main>
      <Footer />
    </div>
  )
}
