'use client'

import { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="text-lg font-semibold text-slate-800">{title}</h2>}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
