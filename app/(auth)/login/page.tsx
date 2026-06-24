'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { AuthShowcase } from '@/components/auth/AuthShowcase'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useI18n } from '@/components/i18n/I18nProvider'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/utils/constants'

export default function LoginPage() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const postAuthPath = plan === 'pro' || plan === 'career_coach' ? `/checkout?plan=${plan}` : '/dashboard'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Already signed in? Don't show the auth screen again — go to the app.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(postAuthPath)
    })
  }, [router, postAuthPath])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(t.login.error)
      setLoading(false)
      return
    }

    router.push(postAuthPath)
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(postAuthPath)}` },
    })
  }

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 bg-slate-50 p-4 lg:grid-cols-2">
      {/* Sol: animasyonlu vitrin */}
      <AuthShowcase />

      {/* Sağ: giriş formu */}
      <div className="relative flex items-center justify-center px-2 py-8 sm:px-6">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt={APP_NAME} width={36} height={36} className="rounded-xl" />
            <span className="text-xl font-bold text-slate-900">{APP_NAME}</span>
          </Link>
          <p className="mt-3 text-slate-500 text-sm">{t.login.subtitle}</p>
        </div>

        {/* Google ile giriş */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors mb-6"
        >
          <GoogleIcon className="h-4 w-4" />
          {t.login.google}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-400">{t.login.orEmail}</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              placeholder={t.login.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder={t.login.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-colors"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? t.login.submitting : t.login.submit}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          {t.login.noAccount}{' '}
          <Link href="/signup" className="font-medium text-purple-600 hover:text-purple-700 transition-colors">
            {t.login.signupLink}
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}
