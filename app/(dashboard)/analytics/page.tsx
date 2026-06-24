import { redirect } from 'next/navigation'

// Analitik dashboard'a taşındı; eski linkler için yönlendir.
export default function AnalyticsPage() {
  redirect('/dashboard')
}
