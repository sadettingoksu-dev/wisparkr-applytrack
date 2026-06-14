import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { extractPdfText } from '@/lib/pdf'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const formData = await request.formData().catch(() => null)
  const file = formData?.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: { code: 'INVALID_FILE', message: 'CV dosyası bulunamadı.' } },
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

  let text: string
  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    text = await extractPdfText(buffer)
  } catch (err) {
    return NextResponse.json(
      { error: { code: 'PDF_PARSE_FAILED', message: 'PDF okunamadı.' } },
      { status: 500 }
    )
  }

  const { error } = await supabase
    .from('profiles')
    .update({ cv_text: text, cv_filename: file.name } as never)
    .eq('id', userId)

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({
    data: {
      filename: file.name,
      text_length: text.length,
      preview: text.slice(0, 300),
    },
  })
}
