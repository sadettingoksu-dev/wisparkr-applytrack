import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { extractPdfText } from '@/lib/pdf'
import type { Application, RequiredDocument } from '@/lib/types'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')
  const indexRaw = formData?.get('index')
  const index = typeof indexRaw === 'string' ? Number.parseInt(indexRaw, 10) : NaN

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: { code: 'INVALID_FILE', message: 'Belge dosyası bulunamadı.' } },
      { status: 400 }
    )
  }

  if (Number.isNaN(index) || index < 0) {
    return NextResponse.json(
      { error: { code: 'INVALID_INDEX', message: 'Geçersiz belge.' } },
      { status: 400 }
    )
  }

  if (file.type !== 'application/pdf') {
    return NextResponse.json(
      { error: { code: 'INVALID_FILE_TYPE', message: 'Sadece PDF dosyaları kabul edilir.' } },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: { code: 'FILE_TOO_LARGE', message: 'Dosya boyutu 5MB\'ı aşamaz.' } },
      { status: 400 }
    )
  }

  const { data: applicationData, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', userId)
    .single()
  const application = applicationData as Application | null

  if (appError || !application) {
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

  let text: string
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    text = await extractPdfText(buffer)
  } catch {
    return NextResponse.json(
      { error: { code: 'PDF_PARSE_FAILED', message: 'PDF okunamadı.' } },
      { status: 500 }
    )
  }

  documents[index] = {
    ...documents[index],
    has: true,
    filename: file.name,
    text,
  }

  await supabase
    .from('applications')
    .update({ required_documents: documents as never } as never)
    .eq('id', params.id)
    .eq('user_id', userId)

  return NextResponse.json({ data: { documents } })
}
