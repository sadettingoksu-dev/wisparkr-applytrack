import { NextResponse } from 'next/server'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { cvDataSchema, parseCvData, flattenCvData, emptyCvData } from '@/lib/cv'

export async function GET() {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { profile } = ctx

  const cvData = profile.cv_data
    ? parseCvData(profile.cv_data)
    : emptyCvData({ fullName: profile.full_name ?? undefined, email: profile.email })

  return NextResponse.json({ data: cvData })
}

export async function PUT(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx
  const { supabase, userId } = ctx

  const json = await request.json().catch(() => null)
  const parsed = cvDataSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }

  const cvData = parsed.data
  // Derive ATS-friendly text so every existing AI feature keeps working.
  const cvText = flattenCvData(cvData)

  const { error } = await supabase
    .from('profiles')
    .update({ cv_data: cvData, cv_text: cvText } as never)
    .eq('id', userId)

  if (error) {
    return NextResponse.json(
      { error: { code: 'DB_ERROR', message: error.message } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { saved: true } })
}
