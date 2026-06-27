import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database.types'

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/board',
  '/applications',
  '/settings',
  '/assistant',
  '/interview',
  '/cv-builder',
  '/documents',
  '/calendar',
  '/analytics',
  '/compare',
]

/**
 * Refreshes the Supabase auth session on every request and redirects
 * unauthenticated users away from protected (dashboard) routes.
 * Called from root middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))
  const isAuthPage = path === '/login' || path === '/signup'

  if (isProtected && !data.user) {
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Oturum açık kullanıcı giriş/kayıt ekranına gelirse doğrudan panele al —
  // tekrar "panele git" demekle uğraşmasın. Plan seçimi varsa ödemeye götür.
  if (isAuthPage && data.user) {
    const plan = request.nextUrl.searchParams.get('plan')
    const dest = plan === 'pro' || plan === 'career_coach' ? `/checkout?plan=${plan}` : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}
