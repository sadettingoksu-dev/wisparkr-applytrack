import { differenceInDays } from 'date-fns'
import type { Application } from '@/lib/types'

export type PlannerTaskKind = 'follow_up' | 'interview_prep' | 'fit_score'

export interface PlannerTask {
  id: string
  kind: PlannerTaskKind
  label: string
  company: string
  href: string
}

const KIND_PRIORITY: Record<PlannerTaskKind, number> = {
  interview_prep: 0,
  follow_up: 1,
  fit_score: 2,
}

export const FOLLOW_UP_AFTER_DAYS = 7

/**
 * Kural tabanlı görev listesi üretir (AI çağrısı yapmaz).
 * - Mülakat aşamasındaki başvurular için hazırlık görevi (mülakat tarihi
 *   yaklaşıyorsa öncelikli ve kaç gün kaldığı belirtilir)
 * - 7+ gündür yanıt bekleyen başvurular için takip görevi
 * - Henüz uyum skoru hesaplanmamış başvurular için fit-score görevi
 */
export function generateTasks(apps: Application[]): PlannerTask[] {
  const tasks: (PlannerTask & { sortKey: number })[] = []

  for (const app of apps) {
    const href = `/applications/${app.id}`

    if (app.status === 'interview') {
      let label = `${app.company_name} mülakatına AI ile hazırlan`
      let sortKey = KIND_PRIORITY.interview_prep

      if (app.interview_date) {
        const daysLeft = differenceInDays(new Date(app.interview_date), new Date())
        if (daysLeft >= 0) {
          label =
            daysLeft === 0
              ? `${app.company_name} mülakatı bugün, AI ile hazırlan`
              : `${app.company_name} mülakatına ${daysLeft} gün kaldı, AI ile hazırlan`
          // Yaklaşan mülakatları listenin en üstüne taşı
          sortKey = KIND_PRIORITY.interview_prep - (1000 - daysLeft)
        }
      }

      tasks.push({ id: `${app.id}-interview_prep`, kind: 'interview_prep', label, company: app.company_name, href, sortKey })
    }

    if (app.status === 'pending') {
      const referenceDate = app.applied_at ?? app.created_at
      if (referenceDate && differenceInDays(new Date(), new Date(referenceDate)) >= FOLLOW_UP_AFTER_DAYS) {
        tasks.push({
          id: `${app.id}-follow_up`,
          kind: 'follow_up',
          label: `${app.company_name} için takip maili gönder`,
          company: app.company_name,
          href,
          sortKey: KIND_PRIORITY.follow_up,
        })
      }

      if (app.fit_score === null) {
        tasks.push({
          id: `${app.id}-fit_score`,
          kind: 'fit_score',
          label: `${app.company_name} için CV uyum skorunu hesapla`,
          company: app.company_name,
          href,
          sortKey: KIND_PRIORITY.fit_score,
        })
      }
    }
  }

  return tasks
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(0, 5)
    .map(({ sortKey, ...task }) => task)
}
