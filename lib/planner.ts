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

const FOLLOW_UP_AFTER_DAYS = 7

/**
 * Kural tabanlı görev listesi üretir (AI çağrısı yapmaz).
 * - Mülakat aşamasındaki başvurular için hazırlık görevi
 * - 7+ gündür yanıt bekleyen başvurular için takip görevi
 * - Henüz uyum skoru hesaplanmamış başvurular için fit-score görevi
 */
export function generateTasks(apps: Application[]): PlannerTask[] {
  const tasks: PlannerTask[] = []

  for (const app of apps) {
    const href = `/applications/${app.id}`

    if (app.status === 'interview') {
      tasks.push({
        id: `${app.id}-interview_prep`,
        kind: 'interview_prep',
        label: `${app.company_name} mülakatına AI ile hazırlan`,
        company: app.company_name,
        href,
      })
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
        })
      }

      if (app.fit_score === null) {
        tasks.push({
          id: `${app.id}-fit_score`,
          kind: 'fit_score',
          label: `${app.company_name} için CV uyum skorunu hesapla`,
          company: app.company_name,
          href,
        })
      }
    }
  }

  return tasks
    .sort((a, b) => KIND_PRIORITY[a.kind] - KIND_PRIORITY[b.kind])
    .slice(0, 5)
}
