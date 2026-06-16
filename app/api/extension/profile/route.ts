import { NextResponse } from 'next/server'
import { requireExtensionAuth, isAuthedContext } from '@/lib/apiAuth'
import type { ApiResponse } from '@/lib/types'

export async function GET(request: Request) {
  const ctx = await requireExtensionAuth(request)
  if (!isAuthedContext(ctx)) return ctx

  const { profile } = ctx

  return NextResponse.json({
    data: {
      full_name: profile.full_name,
      email: profile.email,
    },
  } satisfies ApiResponse<{ full_name: string | null; email: string }>)
}
