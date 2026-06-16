import Link from 'next/link'
import { Link as LinkIcon, FileSearch, MessageSquareText } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const FEATURES = [
  {
    icon: LinkIcon,
    title: 'Kanban ile takip',
    description:
      'İş ilanı linkini yapıştır, başvurunu otomatik oluştur ve Beklemede / Mülakat / Teklif / Reddedildi sütunlarında takip et.',
  },
  {
    icon: FileSearch,
    title: 'AI ile CV uyum skoru',
    description: 'CV\'ni yükle, AI ilana uyum oranını hesaplasın ve seni güçlendirecek önerileri sunsun.',
  },
  {
    icon: MessageSquareText,
    title: 'Mülakat hazırlık asistanı',
    description: 'Mülakat öncesi AI\'a sorularını sor, şirkete özel hazırlık tüyoları al.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <h1 className="text-4xl font-bold text-slate-800 sm:text-5xl">
            İş başvurularını <span className="text-purple-600">AI desteğiyle</span> yönet
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            &ldquo;Başvurdum, ne oldu?&rdquo; sorusuna son. Wisparkr tüm başvuru sürecini tek bir yerden
            yönetmeni sağlar.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/signup">
              <Button className="px-6 py-3 text-base">Ücretsiz Başla</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="secondary" className="px-6 py-3 text-base">
                Fiyatlandırmayı Gör
              </Button>
            </Link>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800">{feature.title}</h3>
                <p className="text-sm text-slate-500">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
