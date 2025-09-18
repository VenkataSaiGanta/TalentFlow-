import React, { useState } from 'react'

export default function TagInput({ value=[], onChange }) {
  const [text, setText] = useState('')
  function add(tag) {
    const t = tag.trim()
    if (!t) return
    const next = Array.from(new Set([...value, t]))
    onChange(next); setText('')
  }
  function remove(t) {
    onChange(value.filter(v=>v!==t))
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map(t=>(
          <span key={t} className="px-2 py-1 bg-slate-100 rounded-lg text-xs">
            {t} <button className="ml-1 text-slate-500" onClick={()=>remove(t)}>×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') add(text)}}
          className="border rounded-lg px-3 py-2 w-full" placeholder="Add tag and hit Enter" />
        <button onClick={()=>add(text)} className="px-3 py-2 bg-slate-900 text-white rounded-lg">Add</button>
      </div>
    </div>
  )
}
