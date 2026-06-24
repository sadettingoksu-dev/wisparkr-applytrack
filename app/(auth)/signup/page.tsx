'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { AuthShowcase } from '@/components/auth/AuthShowcase'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useI18n } from '@/components/i18n/I18nProvider'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/utils/constants'

function PasswordStrength({ password }: { password: string }) {
  const { t } = useI18n()
  const checks = [
    { label: t.signup.strength.min8, ok: password.length >= 8 },
    { label: t.signup.strength.upper, ok: /[A-Z]/.test(password) },
    { label: t.signup.strength.number, ok: /[0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-500']
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : 'bg-slate-100'}`} />
        ))}
      </div>
      <div className="flex gap-3">
        {checks.map((c) => (
          <span key={c.label} className={`flex items-center gap-1 text-[10px] ${c.ok ? 'text-green-400' : 'text-slate-400'}`}>
            <CheckCircle2 className="h-2.5 w-2.5" /> {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SignupPage() {
  const { t } = useI18n()
  const router = useRouter()
  const searchParams = useSearchParams()
  const plan = searchParams.get('plan')
  const postAuthPath = plan === 'pro' || plan === 'career_coach' ? `/checkout?plan=${plan}` : '/dashboard'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  // Already signed in? Don't show the signup screen again — go to the app.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(postAuthPath)
    })
  }, [router, postAuthPath])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t.signup.pwMismatch)
      return
    }
    if (password.length < 8) {
      setError(t.signup.pwTooShort)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError(t.signup.existingEmail)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleSignup() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(postAuthPath)}` },
    })
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setOtpError(null)
    setOtpLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'signup',
    })

    if (error) {
      setOtpError(error.message)
      setOtpLoading(false)
      return
    }

    // Kayıt tamamlandı ve oturum açık (OTP aynı cihazda doğrulandı, PKCE sorunu
    // yok): kullanıcıyı uğraştırmadan doğrudan panele/ödemeye yönlendir.
    router.push(postAuthPath)
  }

  async function handleResendOtp() {
    setOtpError(null)
    setResendMessage(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setOtpError(error.message)
      return
    }
    setResendMessage(t.signup.otp.resentMsg)
  }

  if (success) {
    return (
      <div className="grid min-h-screen grid-cols-1 gap-4 bg-slate-50 p-4 lg:grid-cols-2">
        <AuthShowcase />
        <div className="relative flex items-center justify-center px-2 py-8 sm:px-6">
        <div className="absolute right-4 top-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 border border-purple-200">
            <Mail className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{t.signup.otp.title}</h2>
            <p className="mt-2 text-slate-500 text-sm">
              <span className="text-purple-700 font-medium">{email}</span> {t.signup.otp.sentToA}
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] text-slate-900 placeholder-slate-300 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-colors"
            />

            {otpError && (
              <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{otpError}</p>
            )}
            {resendMessage && (
              <p className="rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 text-xs text-green-400">{resendMessage}</p>
            )}

            <button
              type="submit"
              disabled={otpLoading || otp.length !== 6}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {otpLoading ? t.signup.otp.verifying : t.signup.otp.verify}
            </button>
          </form>

          <p className="text-xs text-slate-400">
            {t.signup.otp.resentQ}{' '}
            <button onClick={handleResendOtp} className="text-purple-600 hover:text-purple-700 transition-colors">
              {t.signup.otp.resend}
            </button>
            .
          </p>
          <Link href="/login" className="block text-sm text-purple-600 hover:text-purple-700 transition-colors">
            {t.signup.otp.backToLogin}
          </Link>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 bg-slate-50 p-4 lg:grid-cols-2">
      <AuthShowcase />
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
          <p className="mt-3 text-slate-500 text-sm">{t.signup.subtitle}</p>
        </div>

        {/* Google ile kayıt */}
        <button
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 transition-colors mb-6"
        >
          <GoogleIcon className="h-4 w-4" />
          {t.signup.google}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-400">{t.signup.orEmail}</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Ad Soyad */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t.signup.fullName}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-colors"
            />
          </div>

          {/* E-posta */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              placeholder={t.signup.email}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-colors"
            />
          </div>

          {/* Şifre */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder={t.signup.password}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-colors"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {password && <PasswordStrength password={password} />}

          {/* Şifre tekrar */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="password"
              placeholder={t.signup.confirm}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-colors"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? t.signup.submitting : t.signup.submit}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          {t.signup.termsPre}{' '}
          <Link href="/pricing" className="text-purple-600 hover:text-purple-700">{t.signup.terms}</Link>
          {' '}{t.signup.and}{' '}
          <span className="text-purple-600">{t.signup.privacy}</span>
          {t.signup.termsPost}
        </p>

        <p className="mt-4 text-center text-sm text-slate-400">
          {t.signup.haveAccount}{' '}
          <Link href="/login" className="font-medium text-purple-600 hover:text-purple-700 transition-colors">
            {t.signup.loginLink}
          </Link>
        </p>
      </div>
      </div>
    </div>
  )
}
