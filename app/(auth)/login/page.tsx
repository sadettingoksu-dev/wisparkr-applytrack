'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { createClient } from '@/lib/supabase/client'
import { APP_NAME } from '@/utils/constants'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-posta veya şifre hatalı.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-dark.png" alt={APP_NAME} width={36} height={36} className="rounded-xl" />
            <span className="text-xl font-bold text-white">{APP_NAME}</span>
          </Link>
          <p className="mt-3 text-white/50 text-sm">Hesabına giriş yap</p>
        </div>

        {/* Google ile giriş */}
        <button
          onClick={handleGoogleLogin}
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

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="email"
              placeholder="E-posta adresi"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Şifre"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-10 py-3 text-sm text-white placeholder-white/30 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-3 text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/40">
          Hesabın yok mu?{' '}
          <Link href="/signup" className="font-medium text-amber-400 hover:text-amber-300 transition-colors">
            Kayıt ol
          </Link>
        </p>
      </div>
    </div>
  )
}
