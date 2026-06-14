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

export const APP_NAME = 'ApplyTrack'
