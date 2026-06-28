import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Handles the redirect from Supabase Auth (email confirmation / OAuth)
 * by exchanging the `code` for a session, then redirecting into the app.
 */
/**
 * `next`'i yalnızca site-içi göreli bir yola izin verecek şekilde doğrular.
 * `//evil.com`, `/\evil.com` veya `https://evil.com` gibi değerler open-redirect
 * (phishing) riski taşır; bunlar reddedilip varsayılana düşülür.
 */
function safeNext(value: string | null): string {
  if (!value) return '/dashboard'
  if (!value.startsWith('/')) return '/dashboard' // mutlak/şemalı URL
  if (value.startsWith('//') || value.startsWith('/\\')) return '/dashboard' // protokol-göreli
  return value
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
