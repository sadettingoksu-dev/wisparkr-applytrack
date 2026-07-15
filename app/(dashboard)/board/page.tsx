import { redirect } from 'next/navigation'

/**
 * Kanban panosu Başvurular sayfasına bir görünüm olarak taşındı.
 *
 * İki sayfa da birebir aynı sorguyu atıyor, aynı Application tipini ve aynı
 * PATCH /api/applications/[id] ucunu kullanıyordu; ayrı duran pano ise
 * arama/filtre/sıralama/plan-limiti uyarısından yoksundu. Artık tek yerde.
 *
 * Bu yönlendirme eski yer imleri ve dış linkler için duruyor.
 */
export default function BoardPage() {
  redirect('/applications?view=board')
}
