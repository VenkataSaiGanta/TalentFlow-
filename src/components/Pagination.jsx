import React from 'react'

export default function Pagination({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center gap-2">
      <button className="px-3 py-1 rounded-lg bg-slate-100 disabled:opacity-50"
        disabled={page<=1} onClick={()=>onPage(page-1)}>Prev</button>
      <span className="text-sm text-slate-500">Page {page} / {pages}</span>
      <button className="px-3 py-1 rounded-lg bg-slate-100 disabled:opacity-50"
        disabled={page>=pages} onClick={()=>onPage(page+1)}>Next</button>
    </div>
  )
}
