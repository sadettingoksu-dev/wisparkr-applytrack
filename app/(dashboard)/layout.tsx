import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen bg-purple-50">
      <Sidebar email={data.user?.email} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
