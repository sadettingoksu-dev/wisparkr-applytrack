import { APP_NAME } from '@/utils/constants'

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {APP_NAME} — Tüm hakları saklıdır.
      </div>
    </footer>
  )
}
