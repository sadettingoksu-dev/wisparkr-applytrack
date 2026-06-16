'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/utils/constants'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'En az 8 karakter', ok: password.length >= 8 },
    { label: 'Büyük harf', ok: /[A-Z]/.test(password) },
    { label: 'Sayı', ok: /[0-9]/.test(password) },
  ]
  const score = checks.filter((c) => c.ok).length
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-500']
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : 'bg-white/10'}`} />
        ))}
      </div>
      <div className="flex gap-3">
        {checks.map((c) => (
          <span key={c.label} className={`flex items-center gap-1 text-[10px] ${c.ok ? 'text-green-400' : 'text-white/30'}`}>
            <CheckCircle2 className="h-2.5 w-2.5" /> {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SignupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
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

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleSignup() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/20 border border-purple-500/30">
            <Mail className="h-8 w-8 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">E-postanı doğrula</h2>
            <p className="mt-2 text-white/50 text-sm">
              <span className="text-purple-300 font-medium">{email}</span> adresine doğrulama bağlantısı gönderdik. Gelen kutunu kontrol et.
            </p>
          </div>
          <p className="text-xs text-white/30">
            Bulamadın mı? Spam klasörünü de kontrol et.
          </p>
          <Link href="/login" className="block text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Giriş sayfasına dön →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt={APP_NAME} width={36} height={36} className="rounded-xl" />
            <span className="text-xl font-bold text-white">{APP_NAME}</span>
          </Link>
          <p className="mt-3 text-white/50 text-sm">Ücretsiz hesabını oluştur</p>
        </div>

        {/* Google ile kayıt */}
        <button
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors mb-6"
        >
          <GoogleIcon className="h-4 w-4" />
          Google ile devam et
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">veya e-posta ile</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* Ad Soyad */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Ad Soyad"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-colors"
            />
          </div>

          {/* E-posta */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="email"
              placeholder="E-posta adresi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-colors"
            />
          </div>

          {/* Şifre */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 py-3 text-sm text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-colors"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {password && <PasswordStrength password={password} />}

          {/* Şifre tekrar */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="password"
              placeholder="Şifre tekrar"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-colors"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-white/30">
          Kayıt olarak{' '}
          <Link href="/pricing" className="text-purple-400 hover:text-purple-300">Kullanım Şartları</Link>
          {' '}ve{' '}
          <span className="text-purple-400">Gizlilik Politikası</span>
          {`'nı`} kabul etmiş olursun.
        </p>

        <p className="mt-4 text-center text-sm text-white/40">
          Zaten hesabın var mı?{' '}
          <Link href="/login" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  )
}
