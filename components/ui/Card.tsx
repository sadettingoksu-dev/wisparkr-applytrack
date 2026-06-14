import { HTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx('rounded-lg bg-white p-6 shadow-md', className)} {...props} />
    )
  }
)

Card.displayName = 'Card'
