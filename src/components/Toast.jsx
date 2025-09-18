import React from 'react'
export default function Toast({ msg, kind='success' }) {
  if (!msg) return null
  const color = kind==='error' ? 'bg-red-600' : 'bg-emerald-600'
  return (
    <div className={`${color} text-white fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl shadow-soft`}>
      {msg}
    </div>
  )
}
