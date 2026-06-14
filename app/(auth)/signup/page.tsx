'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Github } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { APP_NAME } from '@/utils/constants'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  async function handleGitHubSignup() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-purple-50 px-6">
      <Card className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-purple-600">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-slate-500">Ücretsiz hesap oluştur</p>
        </div>

        {success ? (
          <p className="text-center text-sm text-emerald-700">
            Kayıt başarılı! E-postanı kontrol edip hesabını onayla.
          </p>
        ) : (
          <>
            <form onSubmit={handleSignup} className="space-y-3">
              <Input
                type="email"
                placeholder="E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Şifre (tekrar)"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                Kayıt Ol
              </Button>
            </form>

            <Button variant="secondary" className="w-full" onClick={handleGitHubSignup}>
              <Github className="h-4 w-4" />
              GitHub ile Kayıt Ol
            </Button>
          </>
        )}

        <p className="text-center text-sm text-slate-500">
          Zaten hesabın var mı?{' '}
          <Link href="/login" className="font-medium text-purple-600">
            Giriş yap
          </Link>
        </p>
      </Card>
    </div>
  )
}
