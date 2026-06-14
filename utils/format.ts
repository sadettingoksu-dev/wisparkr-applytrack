import { format, formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export function formatDate(date: string | Date, pattern = 'd MMM yyyy'): string {
  return format(new Date(date), pattern, { locale: tr })
}

export function formatRelative(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: tr })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
