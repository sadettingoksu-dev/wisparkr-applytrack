'use client'

import { Fragment } from 'react'
import { Check } from 'lucide-react'
import clsx from 'clsx'

/**
 * Yatay adım göstergesi. Tamamlanan + aktif adımlar mor; aradaki çizgi geçildikçe
 * mora dolar. Tamamlanan adımlara tıklayıp geri dönülebilir.
 */
export function Stepper({
  labels,
  current,
  onJump,
}: {
  labels: string[]
  current: number
  onJump: (i: number) => void
}) {
  return (
    <div className="flex items-center">
      {labels.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <Fragment key={i}>
            <button
              type="button"
              onClick={() => done && onJump(i)}
              disabled={!done}
              className={clsx('flex flex-col items-center gap-1', done && 'cursor-pointer')}
            >
              <span
                className={clsx(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                  active || done ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={clsx(
                  'hidden text-[11px] sm:block',
                  active ? 'font-semibold text-purple-700' : done ? 'text-purple-600' : 'text-slate-400'
                )}
              >
                {label}
              </span>
            </button>
            {i < labels.length - 1 && (
              <div
                className={clsx(
                  'mx-1.5 h-0.5 flex-1 rounded transition-colors sm:mx-2',
                  i < current ? 'bg-purple-600' : 'bg-slate-200'
                )}
              />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}
