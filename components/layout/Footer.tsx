import { APP_NAME } from '@/utils/constants'
import { getServerDict } from '@/lib/i18n-server'

export function Footer() {
  const t = getServerDict()
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} {APP_NAME} — {t.footer.rights}
      </div>
    </footer>
  )
}
