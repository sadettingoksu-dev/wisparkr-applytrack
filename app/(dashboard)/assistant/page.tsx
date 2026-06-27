import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { AIChatPanel } from '@/components/chat/AIChatPanel'
import { AssistantPicker } from '@/components/chat/AssistantPicker'
import { getServerDict } from '@/lib/i18n-server'
import type { Application, AiMessage } from '@/lib/types'

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: { app?: string }
}) {
  const t = getServerDict()
  const supabase = createClient()

  const { data: appsData } = await supabase
    .from('applications')
    .select('id, company_name, position_title')
    .order('created_at', { ascending: false })

  const apps = (appsData ?? []) as Pick<
    Application,
    'id' | 'company_name' | 'position_title'
  >[]

  // Seçili başvuru: query param geçerliyse onu, değilse en yeni başvuruyu kullan.
  const selectedId =
    searchParams.app && apps.some((a) => a.id === searchParams.app)
      ? searchParams.app
      : apps[0]?.id

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.assistant.title}</h1>
          <p className="text-sm text-slate-500">{t.assistant.subtitle}</p>
        </div>
        {apps.length > 0 && (
          <AssistantPicker
            applications={apps}
            selectedId={selectedId}
            label={t.assistant.pickLabel}
          />
        )}
      </div>

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
