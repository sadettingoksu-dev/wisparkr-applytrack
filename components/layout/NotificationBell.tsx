'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import clsx from 'clsx'
import { formatRelative } from '@/utils/format'
import { useI18n } from '@/components/i18n/I18nProvider'
import type { Notification } from '@/lib/types'

export function NotificationBell() {
  const { t } = useI18n()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((json) => setNotifications(json.data ?? []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleSelect(notification: Notification) {
    if (!notification.read) {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notification.id }),
      })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      )
    }
    setOpen(false)
    if (notification.application_id) {
      router.push(`/applications/${notification.application_id}`)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-lg border border-white/10 bg-white/5 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">{t.notifications.title}</p>
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  await Promise.all(
                    notifications.filter((n) => !n.read).map((n) =>
                      fetch('/api/notifications', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: n.id }),
                      })
                    )
                  )
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                }}
                className="text-xs text-amber-500 hover:underline"
              >
                {t.notifications.markAllRead}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-white/40">
                {t.notifications.empty}
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleSelect(n)}
                  className={clsx(
                    'block w-full border-b border-white/10 px-4 py-3 text-left hover:bg-white/5',
                    !n.read && 'bg-amber-500/10'
                  )}
                >
                  <p className="text-sm font-medium text-white">{n.title}</p>
                  <p className="mt-1 text-xs text-white/50">{n.message}</p>
                  <p className="mt-1 text-xs text-white/40">{formatRelative(n.created_at)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
