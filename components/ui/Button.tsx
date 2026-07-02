import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white shadow-brand-sm hover:-translate-y-px hover:shadow-brand focus-visible:ring-purple-500/60 active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-brand-sm',
  secondary:
    'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-100 hover:bg-purple-100 focus-visible:ring-purple-500/50',
  danger: 'bg-red-500 text-white shadow-sm hover:bg-red-600 focus-visible:ring-red-500/60',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-400/50',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          // transform + opacity + shadow animasyonu (transition-all yok); her varyantta
          // hover + focus-visible + active durumu.
          'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-[transform,box-shadow,background-color,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:focus-visible:ring-offset-slate-950',
          variantClasses[variant],
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'
