import { HTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('rounded-2xl border border-slate-200 bg-white p-6 shadow-card', className)} {...props} />
    )
  }
)

Card.displayName = 'Card'
