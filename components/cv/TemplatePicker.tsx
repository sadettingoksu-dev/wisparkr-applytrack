'use client'

const TEMPLATES = [
  { id: 'classic', label: 'Klasik' },
  { id: 'modern', label: 'Modern' },
  { id: 'minimal', label: 'Sade' },
] as const

export type CvTemplate = (typeof TEMPLATES)[number]['id']

export function TemplatePicker({
  value,
  onChange,
}: {
  value: CvTemplate
  onChange: (t: CvTemplate) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-white/40">Şablon:</span>
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            value === t.id
              ? 'bg-amber-500/15 text-amber-300'
              : 'bg-white/5 text-white/50 hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
