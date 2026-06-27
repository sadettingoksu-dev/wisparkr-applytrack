'use client'

import { useRouter } from 'next/navigation'

interface AssistantPickerProps {
  applications: { id: string; company_name: string; position_title: string }[]
  selectedId?: string
  label: string
}

/** Başvuru seçtiren küçük dropdown; seçim değişince /assistant?app=<id> ile yeniden yükler. */
export function AssistantPicker({ applications, selectedId, label }: AssistantPickerProps) {
  const router = useRouter()

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="shrink-0 text-slate-500">{label}</span>
      <select
        value={selectedId ?? ''}
        onChange={(e) => router.push(`/assistant?app=${e.target.value}`)}
        className="max-w-[18rem] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-100"
      >
        {applications.map((a) => (
          <option key={a.id} value={a.id}>
            {a.position_title} — {a.company_name}
          </option>
        ))}
      </select>
    </label>
  )
}
