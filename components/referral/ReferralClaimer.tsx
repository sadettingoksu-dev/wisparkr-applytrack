'use client'

import { useEffect } from 'react'

/**
 * Signup sırasında localStorage'a yazılan referans kodunu, kullanıcı panele
 * ilk girdiğinde işler (hem e-posta hem Google kayıt akışını kapsar).
 * Sunucu tarafı zaten "tek kez" ve "kendi kodun değil" kontrolü yapar.
 */
export function ReferralClaimer() {
  useEffect(() => {
    let code: string | null = null
    try {
      code = localStorage.getItem('wisparkr_ref')
    } catch {
      /* yoksay */
    }
    if (!code) return
    fetch('/api/referral/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    }).finally(() => {
      try {
        localStorage.removeItem('wisparkr_ref')
      } catch {
        /* yoksay */
      }
    })
  }, [])
  return null
}
