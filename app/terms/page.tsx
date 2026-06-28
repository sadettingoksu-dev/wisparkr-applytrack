import { LegalPage } from '@/components/legal/LegalPage'
import { TERMS } from '@/lib/legal'
import { getServerLocale } from '@/lib/i18n-server'

export default function TermsPage() {
  return <LegalPage doc={TERMS[getServerLocale()]} />
}
