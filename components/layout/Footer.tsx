import { APP_NAME } from '@/utils/constants'

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-white/5">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-white/50">
        © {new Date().getFullYear()} {APP_NAME} — Tüm hakları saklıdır.
      </div>
    </footer>
  )
}
