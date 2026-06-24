import type { ApplicationStatus } from '@/lib/types'

/** Kanban board columns, in display order. */
export const KANBAN_COLUMNS: { id: ApplicationStatus; label: string }[] = [
  { id: 'pending', label: 'Beklemede' },
  { id: 'interview', label: 'Mülakat' },
  { id: 'offer', label: 'Teklif' },
  { id: 'rejected', label: 'Reddedildi' },
]

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  pending: 'Beklemede',
  interview: 'Mülakat',
  offer: 'Teklif',
  rejected: 'Reddedildi',
}

/** Badge color classes per application status (Tailwind brand palette). */
export const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  pending: 'bg-purple-50 text-purple-600',
  interview: 'bg-purple-50 text-purple-600',
  offer: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-500',
}

export const APP_NAME = 'Wisparkr'

/** Minimum "başvuru hazırlık skoru" required to unlock the tailored CV PDF download. */
export const MIN_APPLY_SCORE = 75

export type ApplyReadinessKey = 'applyExcellent' | 'applyReady' | 'applyNotReady'
export type InterviewReadinessKey = 'interviewReady' | 'interviewImprove' | 'interviewMore'

/** Etiket metni sözlükten (t.readiness[levelKey]) kurulur. */
export function getApplyReadiness(score: number): { levelKey: ApplyReadinessKey; className: string } {
  if (score >= 90) {
    return { levelKey: 'applyExcellent', className: 'text-emerald-700' }
  }
  if (score >= MIN_APPLY_SCORE) {
    return { levelKey: 'applyReady', className: 'text-emerald-600' }
  }
  return { levelKey: 'applyNotReady', className: 'text-amber-600' }
}

/** Number of interviewer questions in a mock interview session. */
export const MOCK_INTERVIEW_QUESTION_COUNT = 6

export function getInterviewReadiness(score: number): { levelKey: InterviewReadinessKey; className: string } {
  if (score >= 85) {
    return { levelKey: 'interviewReady', className: 'text-emerald-700' }
  }
  if (score >= 60) {
    return { levelKey: 'interviewImprove', className: 'text-amber-600' }
  }
  return { levelKey: 'interviewMore', className: 'text-red-500' }
}
