'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Github } from 'lucide-react'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { APP_NAME } from '@/utils/constants'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  async function handleGitHubLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-purple-50 px-6">
      <Card className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-purple-600">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-slate-500">Hesabına giriş yap</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
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
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            Giriş Yap
          </Button>
        </form>

        <Button variant="secondary" className="w-full" onClick={handleGoogleLogin}>
          <GoogleIcon className="h-4 w-4" />
          Google ile Giriş Yap
        </Button>

        <Button variant="secondary" className="w-full" onClick={handleGitHubLogin}>
          <Github className="h-4 w-4" />
          GitHub ile Giriş Yap
        </Button>

        <p className="text-center text-sm text-slate-500">
          Hesabın yok mu?{' '}
          <Link href="/signup" className="font-medium text-purple-600">
            Kayıt ol
          </Link>
        </p>
      </Card>
    </div>
  )
}
