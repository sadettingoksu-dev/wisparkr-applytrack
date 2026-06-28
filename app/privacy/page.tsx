import { LegalPage } from '@/components/legal/LegalPage'
import { PRIVACY } from '@/lib/legal'
import { getServerLocale } from '@/lib/i18n-server'

export default function PrivacyPage() {
  const doc = PRIVACY[getServerLocale()] ?? PRIVACY.en ?? PRIVACY.tr!
  return <LegalPage doc={doc} />
}
