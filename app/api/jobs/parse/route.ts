import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth, isAuthedContext } from '@/lib/apiAuth'
import { parseJobUrl } from '@/lib/jobParser'

const bodySchema = z.object({
  url: z.string().url(),
})

export async function POST(request: Request) {
  const ctx = await requireAuth()
  if (!isAuthedContext(ctx)) return ctx

  const json = await request.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'INVALID_BODY', message: parsed.error.message } },
      { status: 400 }
    )
  }

  try {
    const result = await parseJobUrl(parsed.data.url)
    return NextResponse.json({ data: result })
  } catch (err) {
    return NextResponse.json(
      {
        error: {
          code: 'FETCH_FAILED',
          message:
            'İlan sayfası okunamadı (site sunucu erişimini engelliyor olabilir). Lütfen başka bir ilan linki deneyin.',
        },
      },
      { status: 502 }
    )
  }
}
