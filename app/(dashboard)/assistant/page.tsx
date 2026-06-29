import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { AIChatPanel } from '@/components/chat/AIChatPanel'
import { AssistantPicker } from '@/components/chat/AssistantPicker'
import { FeatureLock } from '@/components/billing/FeatureLock'
import { getServerDict } from '@/lib/i18n-server'
import { resolveSelectedApp } from '@/lib/selectedApp'
import { getEffectivePlan } from '@/lib/plans'
import type { Application, AiMessage, Profile } from '@/lib/types'

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: { app?: string }
}) {
  const t = getServerDict()
  const supabase = createClient()

  // Plan kilidi: AI Kariyer Asistanı Career Coach planına özel.
  const { data: userData } = await supabase.auth.getUser()
  const { data: profileData } = await supabase
    .from('profiles')
    .select('plan, trial_ends_at')
    .eq('id', userData.user!.id)
    .single()
  if (!getEffectivePlan(profileData as Profile | null).features.aiAssistant) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.assistant.title}</h1>
          <p className="text-sm text-slate-500">{t.assistant.subtitle}</p>
        </div>
        <FeatureLock
          title={t.billing.lockTitle}
          description={t.billing.lockDescAssistant}
          planId="career_coach"
          ctaLabel={t.billing.lockCta}
        />
      </div>
    )
  }

  const { data: appsData } = await supabase
    .from('applications')
    .select('id, company_name, position_title')
    .order('created_at', { ascending: false })

  const apps = (appsData ?? []) as Pick<
    Application,
    'id' | 'company_name' | 'position_title'
  >[]

  // Seçili başvuru: query param > cookie (sayfalar arası ortak) > en yeni başvuru.
  const selectedId = resolveSelectedApp(apps, searchParams.app, cookies().get('coach_app')?.value)

  let messages: AiMessage[] = []
  if (selectedId) {
    const { data } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('application_id', selectedId)
      .order('created_at', { ascending: true })
    messages = (data ?? []) as AiMessage[]
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t.assistant.title}</h1>
        <p className="text-sm text-slate-500">{t.assistant.subtitle}</p>
      </div>

      {apps.length > 0 && (
        <Card className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t.assistant.pickPrompt}</p>
            <p className="text-xs text-slate-500">{t.assistant.pickHint}</p>
          </div>
          <AssistantPicker applications={apps} selectedId={selectedId} label="" />
        </Card>
      )}

      {apps.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">{t.assistant.noApps}</p>
        </Card>
      ) : selectedId ? (
        // key={selectedId}: başvuru değişince panel sıfırdan, doğru geçmişle yüklensin.
        <div className="h-[calc(100vh-260px)] min-h-[480px]">
          <AIChatPanel
            key={selectedId}
            applicationId={selectedId}
            initialMessages={messages}
          />
        </div>
      ) : null}
    </div>
  )
}
