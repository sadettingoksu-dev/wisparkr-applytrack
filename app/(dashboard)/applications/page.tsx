import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { CompareSelector } from '@/components/applications/CompareSelector'
import { STATUS_LABELS, STATUS_BADGE_CLASSES } from '@/utils/constants'
import { formatDate } from '@/utils/format'
import type { Application } from '@/lib/types'

export default async function ApplicationsPage() {
  const supabase = createClient()
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  const apps = (applications ?? []) as Application[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Başvurular</h1>
          <p className="text-sm text-slate-500">Tüm başvurularının listesi</p>
        </div>
        <div className="flex items-center gap-2">
          {apps.length >= 2 && <CompareSelector apps={apps} />}
          <Link href="/applications/new">
            <Button>
              <Plus className="h-4 w-4" />
              Yeni Başvuru
            </Button>
          </Link>
        </div>
      </div>

      {apps.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">Henüz başvuru eklemediniz.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <Link key={app.id} href={`/applications/${app.id}`}>
              <Card className="flex items-center justify-between transition-shadow hover:shadow-lg">
                <div>
                  <p className="font-semibold text-slate-800">{app.position_title}</p>
                  <p className="text-sm text-slate-500">{app.company_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  {app.applied_at && (
                    <span className="text-xs text-slate-400">{formatDate(app.applied_at)}</span>
                  )}
                  <Badge className={STATUS_BADGE_CLASSES[app.status]}>
                    {STATUS_LABELS[app.status]}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
