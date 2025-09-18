import React, { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { stages } from '../db'
import Toast from '../components/Toast'

export default function Kanban() {
  const [cols, setCols] = useState({})
  const dragging = useRef(null)
  const [toast, setToast] = useState('')
  const [kind, setKind] = useState('success')

  async function load(){
    // Load ALL candidates to populate the board
    const res = await api('/candidates?all=1')
    const byStage = {}
    stages.forEach(s=> byStage[s]=[])
    res.items.forEach(c => (byStage[c.stage] = byStage[c.stage] || []).push(c))
    setCols(byStage)
  }
  useEffect(()=>{ load() }, [])

  function onDragStart(c){ dragging.current = c }

  async function onDrop(stage) {
    const c = dragging.current
    if (!c || c.stage === stage) return
    // optimistic move
    setCols(prev=>{
      const next = structuredClone(prev)
      next[c.stage] = next[c.stage].filter(x=>x.id!==c.id)
      next[stage] = [{...c, stage}, ...next[stage]]
      return next
    })
    try {
      await api(`/candidates/${c.id}`, { method:'PATCH', body: JSON.stringify({ stage })})
      setToast('Stage updated')
    } catch {
      setKind('error'); setToast('Update failed — rolled back'); load()
    } finally {
      setTimeout(()=>{ setToast(''); setKind('success') }, 1400)
      dragging.current = null
    }
  }

  return (
    <div className="container-xl py-6">
      <h1 className="text-xl font-semibold mb-4">Kanban — Stage Transitions</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stages.map(s=>(
          <div key={s}
            onDragOver={e=>e.preventDefault()}
            onDrop={()=>onDrop(s)}
            className="bg-white rounded-2xl shadow-soft border p-3 min-h-[520px]">
            <div className="font-semibold mb-2 capitalize sticky top-0 bg-white rounded-xl p-2 border-b">{s}</div>
            <div className="space-y-2">
              {(cols[s]||[]).map(c=>(
                <div key={c.id}
                  draggable
                  onDragStart={()=>onDragStart(c)}
                  className="border rounded-xl px-3 py-2 bg-slate-50 hover:bg-white transition cursor-grab">
                  <div className="font-medium text-sm">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.email}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Toast msg={toast} kind={kind} />
    </div>
  )
}
