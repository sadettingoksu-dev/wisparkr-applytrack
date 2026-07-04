import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Faq } from '@/components/landing/Faq'
import { getServerDict } from '@/lib/i18n-server'

export default function FaqPage() {
  const t = getServerDict()
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Faq heading={t.faq.heading} subtitle={t.faq.subtitle} items={t.faq.items} />
      </main>
      <Footer />
    </div>
  )
}
