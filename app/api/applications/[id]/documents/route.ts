import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import type { Application, RequiredDocument } from '@/lib/types'

const bodySchema = z.object({
  index: z.number().int().min(0),
  has: z.boolean().nullable(),
})

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }
  const { index, has } = parsed.data

  const { data: applicationData, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()
  const application = applicationData as Application | null

  if (error || !application) {
    return NextResponse.json(
      { error: { code: 'APPLICATION_NOT_FOUND', message: 'Başvuru bulunamadı.' } },
      { status: 404 }
    )
  }

  const documents = Array.isArray(application.required_documents)
    ? ([...(application.required_documents as unknown as RequiredDocument[])])
    : []

  if (index >= documents.length) {
    return NextResponse.json(
      { error: { code: 'INVALID_INDEX', message: 'Geçersiz belge.' } },
      { status: 400 }
    )
  }

  documents[index] = {
    ...documents[index],
    has,
    ...(has === false ? { filename: null, text: null } : {}),
  }

  await supabase
    .from('applications')
    .update({ required_documents: documents as never } as never)
    .eq('id', params.id)
    .eq('user_id', userId)

  return NextResponse.json({ data: { documents } })
}
