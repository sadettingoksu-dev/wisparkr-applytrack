import { differenceInDays } from 'date-fns'
import type { Application } from '@/lib/types'

export type PlannerTaskKind = 'follow_up' | 'interview_prep' | 'fit_score'

/** Etiket varyantı — gerçek metin sözlükten (t.planner) kurulur. */
export type PlannerVariant =
  | 'interview_prep'
  | 'interview_today'
  | 'interview_days'
  | 'follow_up'
  | 'fit_score'

/** Görevin neden üretildiğini açıklayan etiket — bkz. t.planner.reason_* */
export type PlannerReason = 'reason_interview' | 'reason_follow_up' | 'reason_fit_score'

export interface PlannerTask {
  id: string
  kind: PlannerTaskKind
  variant: PlannerVariant
  reason: PlannerReason
  company: string
  daysLeft?: number
  /** follow_up görevlerinde: kaç gündür yanıt bekleniyor (reason metninde kullanılır). */
  daysWaiting?: number
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
      let variant: PlannerVariant = 'interview_prep'
      let daysLeft: number | undefined
      let sortKey = KIND_PRIORITY.interview_prep

      if (app.interview_date) {
        const days = differenceInDays(new Date(app.interview_date), new Date())
        if (days >= 0) {
          variant = days === 0 ? 'interview_today' : 'interview_days'
          daysLeft = days
          // Yaklaşan mülakatları listenin en üstüne taşı
          sortKey = KIND_PRIORITY.interview_prep - (1000 - days)
        }
      }

      tasks.push({ id: `${app.id}-interview_prep`, kind: 'interview_prep', variant, reason: 'reason_interview', daysLeft, company: app.company_name, href, sortKey })
    }

    if (app.status === 'pending') {
      const referenceDate = app.applied_at ?? app.created_at
      const daysWaiting = referenceDate ? differenceInDays(new Date(), new Date(referenceDate)) : 0
      if (referenceDate && daysWaiting >= FOLLOW_UP_AFTER_DAYS) {
        tasks.push({
          id: `${app.id}-follow_up`,
          kind: 'follow_up',
          variant: 'follow_up',
          reason: 'reason_follow_up',
          daysWaiting,
          company: app.company_name,
          href,
          sortKey: KIND_PRIORITY.follow_up,
        })
      }

      if (app.fit_score === null) {
        tasks.push({
          id: `${app.id}-fit_score`,
          kind: 'fit_score',
          variant: 'fit_score',
          reason: 'reason_fit_score',
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

/**
 * Gelecekteki mülakatlar, en yakın önce.
 *
 * `applications.interview_date` tek kaynaktır — Takvim sayfası da, ana sayfadaki
 * "Yaklaşan mülakatlar" kartı da bunu kullanır (aynı türetimi iki yerde
 * yazmamak için burada).
 */
export function getUpcomingInterviews(apps: Application[]): Application[] {
  const now = new Date()
  return apps
    .filter((app) => app.interview_date && new Date(app.interview_date) >= now)
    .sort((a, b) => new Date(a.interview_date!).getTime() - new Date(b.interview_date!).getTime())
}
