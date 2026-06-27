import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MockInterviewChat } from '@/components/interview/MockInterviewChat'
import { getServerDict } from '@/lib/i18n-server'
import type { Application, MockInterview, MockInterviewMessage } from '@/lib/types'

export default async function MockInterviewPage({
  params,
}: {
  params: { id: string; interviewId: string }
}) {
  const t = getServerDict()
  const supabase = createClient()

  const { data: interviewData } = await supabase
    .from('mock_interviews')
    .select('*')
    .eq('id', params.interviewId)
    .single()
  const interview = interviewData as MockInterview | null

  if (!interview || interview.application_id !== params.id) notFound()

  const { data: applicationData } = await supabase
    .from('applications')
    .select('*')
    .eq('id', params.id)
    .single()
  const application = applicationData as Application | null

  if (!application) notFound()

  const { data: messagesData } = await supabase
    .from('mock_interview_messages')
    .select('*')
    .eq('mock_interview_id', interview.id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-3">
      <Link
        href={`/interview?app=${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        {t.mockPage.back}
      </Link>

      <div className="h-[calc(100vh-150px)] min-h-[640px]">
        <MockInterviewChat
          interview={interview}
          initialMessages={(messagesData ?? []) as MockInterviewMessage[]}
          jobTitle={application.position_title}
          company={application.company_name}
        />
      </div>
    </div>
  )
}
