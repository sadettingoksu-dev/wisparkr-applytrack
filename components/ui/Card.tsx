import { HTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm', className)} {...props} />
    )
  }
)

Card.displayName = 'Card'
