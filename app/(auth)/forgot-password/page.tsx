'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react'
import { AuthShowcase } from '@/components/auth/AuthShowcase'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useI18n } from '@/components/i18n/I18nProvider'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/utils/constants'

type Step = 'email' | 'code' | 'done'

export default function ForgotPasswordPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)

    const supabase = createClient()
    // Kurtarma e-postası gönder. Supabase kullanıcı sayımı (enumeration) korumasıyla
    // var olmayan e-postalarda da hata DÖNMEZ; bu yüzden her durumda kod adımına
    // geçeriz (e-posta kayıtlıysa kod gelir).
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setStep('code')
    setLoading(false)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError(t.forgotPassword.pwMismatch)
      return
    }
    if (password.length < 8) {
      setError(t.forgotPassword.pwTooShort)
      return
    }

    setLoading(true)
    const supabase = createClient()

    // 1) Kurtarma kodunu doğrula → geçici oturum aç (OTP cihaz bağımsız, PKCE sorunu yok)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery',
    })
    if (verifyError) {
      setError(t.forgotPassword.invalidCode)
      setLoading(false)
      return
    }

    // 2) Yeni şifreyi ayarla
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setStep('done')
    setLoading(false)
    // Oturum zaten açık; kısa bir onay sonrası panele al.
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  async function handleResend() {
    setError(null)
    setInfo(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
    })
    if (error) {
      setError(error.message)
      return
    }
    setInfo(t.forgotPassword.resentMsg)
  }

  const inputBase =
    'w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-colors'

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
          </div>

          {step === 'email' && (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-slate-900">{t.forgotPassword.title}</h2>
                <p className="mt-2 text-sm text-slate-500">{t.forgotPassword.subtitle}</p>
              </div>

              <form onSubmit={handleSendCode} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder={t.forgotPassword.email}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={inputBase}
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? t.forgotPassword.sending : t.forgotPassword.sendCode}
                </button>
              </form>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-purple-200 bg-purple-100">
                  <KeyRound className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{t.forgotPassword.codeTitle}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  <span className="font-medium text-purple-700">{email}</span> {t.forgotPassword.codeSentToA}
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] text-slate-900 placeholder-slate-300 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-colors"
                />

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder={t.forgotPassword.newPassword}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-200 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-500"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder={t.forgotPassword.confirmPassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={inputBase}
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>
                )}
                {info && (
                  <p className="rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs text-green-400">{info}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-500 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? t.forgotPassword.resetting : t.forgotPassword.reset}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-400">
                {t.forgotPassword.resendQ}{' '}
                <button onClick={handleResend} className="text-purple-600 transition-colors hover:text-purple-700">
                  {t.forgotPassword.resend}
                </button>
              </p>
            </>
          )}

          {step === 'done' && (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{t.forgotPassword.successTitle}</h2>
                <p className="mt-2 text-sm text-slate-500">{t.forgotPassword.successMsg}</p>
              </div>
            </div>
          )}

          {step !== 'done' && (
            <p className="mt-6 text-center text-sm">
              <Link href="/login" className="font-medium text-purple-600 transition-colors hover:text-purple-700">
                {t.forgotPassword.backToLogin}
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
