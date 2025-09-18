
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '../api'
import { stages } from '../db'
import Toast from '../components/Toast'
import VirtualList from '../components/VirtualList'

export default function Candidates({ navigate }) {
  const [jobs, setJobs] = useState([])
  const [jobId, setJobId] = useState('')
  const [stageFilter, setStageFilter] = useState('') 
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [tab, setTab] = useState('list') 
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [kind, setKind] = useState('success')

  
  const dragRef = useRef(null) 
  const [hoverStage, setHoverStage] = useState('')

  useEffect(() => {
    fetch('/jobs?check=all').then(r => r.json()).then(res => {
      setJobs(res.items || [])
      if (res.items?.length) setJobId(String(res.items[0].id))
    })
  }, [])

  async function load() {
    if (!jobId) return
    setLoading(true)
    try {
      const data = await api(`/candidates?jobId=${jobId}&pageSize=2000${stageFilter ? `&stage=${stageFilter}` : ''}`)
      const list = (data.items || []).map(c => ({ ...c, stage: String(c.stage) }))
      setItems(list)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [jobId, stageFilter])

  // client search
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter(c => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s))
  }, [items, q])

  // --- Kanban helpers ---
  const columns = useMemo(() => {
    const map = Object.fromEntries(stages.map(s => [s.id, []]))
    for (const c of filtered) { (map[c.stage] ||= []).push(c) }
    return map
  }, [filtered])

  function onDragStart(c) { dragRef.current = { id: c.id, fromStage: c.stage } }
  function onDragEnd() { dragRef.current = null; setHoverStage('') }
  function onDragOver(stageId, e) { e.preventDefault(); setHoverStage(stageId) }
  async function onDrop(stageId) {
    const drag = dragRef.current
    if (!drag) return
    if (drag.fromStage === stageId) { onDragEnd(); return }

    const prev = items
    const next = prev.map(c => (c.id === drag.id ? { ...c, stage: stageId } : c))
    setItems(next); setKind('success'); setToast('Moving…')
    try {
      await api(`/candidates/${drag.id}`, { method: 'PATCH', body: JSON.stringify({ stage: stageId }) })
      setToast('Moved')
    } catch {
      setItems(prev); setKind('error'); setToast('Move failed — rolled back')
    } finally {
      setTimeout(()=>setToast(''), 1100); onDragEnd()
    }
  }

  return (
    <div className="container-xl py-6 space-y-4">
      {/* Filters */}
      <div className="card p-4">
        <div className="grid lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs text-slate-500 mb-1">Job</label>
            <select className="select" value={jobId} onChange={e => setJobId(e.target.value)}>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Stage</label>
            <select className="select" value={stageFilter} onChange={e=>setStageFilter(e.target.value)}>
              <option value="">All stages</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Search</label>
            <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="name or email…" />
          </div>
          <div className="flex items-end gap-2">
            <button className={`selectable ${tab==='list'?'selected':''}`} onClick={()=>setTab('list')}>List</button>
            <button className={`selectable ${tab==='board'?'selected':''}`} onClick={()=>setTab('board')}>Kanban</button>
          </div>
        </div>
      </div>

      {/* List (virtualized) */}
      {tab==='list' && (
        <div className="card p-0">
          <div className="grid grid-cols-12 px-4 py-3 border-b text-xs font-medium text-slate-500">
            <div className="col-span-4">Name</div>
            <div className="col-span-4">Email</div>
            <div className="col-span-2">Stage</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {loading ? (
            <div className="p-4 text-sm text-slate-500">Loading…</div>
          ) : (
            <VirtualList
              items={filtered}
              rowHeight={68}
              className="h-[70vh]"
              renderRow={(c) => (
                <div key={c.id} className="grid grid-cols-12 px-4 items-center border-b last:border-b-0" style={{ height: 68 }}>
                  <div className="col-span-4">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-slate-500">#{c.id}</div>
                  </div>
                  <div className="col-span-4 text-sm">{c.email}</div>
                  <div className="col-span-2">
                    <span className="pill">{(stages.find(s=>s.id===c.stage)||{}).label || c.stage}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    <button
                      className="btn-ghost text-sm"
                      onClick={()=>navigate(`/candidates/${c.id}`)}
                    >
                      Open
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      )}

      {/* Kanban */}
      {tab==='board' && (
        <div className="grid lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {stages.map(stage => {
            const list = (columns[stage.id] || [])
            const isHover = hoverStage === stage.id
            return (
              <div key={stage.id}
                   onDragOver={(e)=>onDragOver(stage.id, e)}
                   onDrop={()=>onDrop(stage.id)}
                   className={`card p-3 min-h-[60vh] flex flex-col ${isHover ? 'ring-2 ring-sky-400' : ''}`}>
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="font-medium">{stage.label}</div>
                  <div className="pill">{list.length}</div>
                </div>
                {loading && <div className="text-sm text-slate-500 p-3">Loading…</div>}
                <div className="mt-3 space-y-3 flex-1">
                  {list.map(c => (
                    <article key={c.id}
                             draggable
                             onDragStart={()=>onDragStart(c)}
                             onDragEnd={onDragEnd}
                             className="p-3 border rounded-xl bg-white shadow-sm hover:shadow-md transition cursor-grab">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-slate-600">{c.email}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(c.tags||[]).map(t => <span key={t} className="pill">{t}</span>)}
                      </div>
                      <div className="mt-2 text-right">
                        <button className="btn-ghost text-xs" onClick={()=>navigate(`/candidates/${c.id}`)}>Profile →</button>
                      </div>
                    </article>
                  ))}
                  {!loading && list.length===0 && <div className="text-xs text-slate-500 p-2">No candidates</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Toast msg={toast} kind={kind} />
    </div>
  )
}
