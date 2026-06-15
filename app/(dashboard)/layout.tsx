import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen bg-purple-50">
      <Sidebar email={data.user?.email} />
      <div className="flex-1">
        <div className="flex justify-end px-8 py-4">
          <NotificationBell />
        </div>
        <main className="px-8 pb-8">{children}</main>
      </div>
    </div>
  )
}
