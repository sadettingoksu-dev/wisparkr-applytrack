import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MockInterviewChat } from '@/components/interview/MockInterviewChat'
import type { Application, MockInterview, MockInterviewMessage } from '@/lib/types'

export default async function MockInterviewPage({
  params,
}: {
  params: { id: string; interviewId: string }
}) {
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
    <div className="space-y-4">
      <div>
        <Link
          href={`/applications/${params.id}`}
          className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Başvuruya geri dön
        </Link>
        <h1 className="mt-1 text-xl font-bold text-white">
          {application.position_title} — Mock Mülakat
        </h1>
        <p className="text-sm text-white/50">{application.company_name}</p>
      </div>

      <div className="h-[600px]">
        <MockInterviewChat
          interview={interview}
          initialMessages={(messagesData ?? []) as MockInterviewMessage[]}
        />
      </div>
    </div>
  )
}
