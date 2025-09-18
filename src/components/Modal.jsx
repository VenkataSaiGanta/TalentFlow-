import React from 'react'

export default function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-soft">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button className="text-slate-500 hover:text-slate-800" onClick={onClose}>✕</button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="p-4 border-t bg-slate-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  )
}
