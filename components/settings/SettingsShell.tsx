'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Wand2, Plug, Bell, AlertTriangle, X, type LucideIcon } from 'lucide-react'
import clsx from 'clsx'
import { useI18n } from '@/components/i18n/I18nProvider'
import { SettingsGroup, SettingsRow } from '@/components/settings/SettingsList'
import { CvUploadCard } from '@/components/settings/CvUploadCard'
import { CvPolishCard } from '@/components/settings/CvPolishCard'
import { ForwardingEmailCard } from '@/components/settings/ForwardingEmailCard'
import { ExtensionTokenCard } from '@/components/settings/ExtensionTokenCard'
import { NotificationPrefsCard } from '@/components/settings/NotificationPrefsCard'
import { ReferralCard } from '@/components/settings/ReferralCard'
import { DangerZoneCard } from '@/components/settings/DangerZoneCard'
import { LockedFeatureCard } from '@/components/billing/LockedFeatureCard'
import { format } from '@/lib/i18n'
import { PLANS, requiredPlanForFeature } from '@/lib/plans'

type Section = 'account' | 'polish' | 'connections' | 'notifications' | 'danger'

export interface SettingsShellProps {
  email: string
  cvFilename: string | null
  extensionToken: string
  userId: string
  notify: { notify_status_change: boolean; notify_interview: boolean; notify_product: boolean }
  canPolish: boolean
  polishHasCv: boolean
}

export function SettingsShell(props: SettingsShellProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [active, setActive] = useState<Section>('account')

  const nav: { id: Section; label: string; icon: LucideIcon; tone?: 'danger' }[] = [
    { id: 'account', label: t.settings.groupAccount, icon: User },
    { id: 'polish', label: t.cvPolish.title, icon: Wand2 },
    { id: 'connections', label: t.settings.groupConnections, icon: Plug },
    { id: 'notifications', label: t.settings.notify.title, icon: Bell },
    { id: 'danger', label: t.settings.danger.title, icon: AlertTriangle, tone: 'danger' },
  ]

  function close() {
    router.push('/dashboard')
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        {/* Başlık çubuğu */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h1 className="text-lg font-bold text-slate-900">{t.settings.title}</h1>
          <button
            type="button"
            onClick={close}
            aria-label={t.common.close}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Sol: kategori menüsü */}
          <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 p-2 md:w-56 md:shrink-0 md:flex-col md:overflow-visible md:border-b-0 md:border-r">
            {nav.map(({ id, label, icon: Icon, tone }) => {
              const selected = active === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActive(id)}
                  className={clsx(
                    'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    selected
                      ? tone === 'danger'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-white text-purple-700 shadow-sm ring-1 ring-slate-200'
                      : tone === 'danger'
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="whitespace-nowrap">{label}</span>
                </button>
              )
            })}
          </nav>

          {/* Sağ: seçili kategori içeriği */}
          <div className="min-w-0 flex-1 space-y-6 p-5 md:max-h-[70vh] md:overflow-y-auto">
            {active === 'account' && (
              <SettingsGroup>
                <SettingsRow label={t.settings.email}>
                  <span className="truncate text-sm text-slate-500">{props.email}</span>
                </SettingsRow>
                <CvUploadCard initialFilename={props.cvFilename} />
              </SettingsGroup>
            )}

            {active === 'polish' &&
              (props.canPolish ? (
                <CvPolishCard hasCv={props.polishHasCv} />
              ) : (
                <LockedFeatureCard
                  title={t.billing.features.cvPolish}
                  description={format(t.billing.lockCardDesc, { plan: PLANS[requiredPlanForFeature('cvPolish')].name })}
                  planId="pro"
                  ctaLabel={t.billing.lockCta}
                />
              ))}

            {active === 'connections' && (
              <SettingsGroup>
                <ExtensionTokenCard initialToken={props.extensionToken} />
                <ForwardingEmailCard userId={props.userId} />
                <ReferralCard />
              </SettingsGroup>
            )}

            {active === 'notifications' && (
              <SettingsGroup>
                <NotificationPrefsCard initial={props.notify} />
              </SettingsGroup>
            )}

            {active === 'danger' && (
              <SettingsGroup tone="danger">
                <DangerZoneCard />
              </SettingsGroup>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
