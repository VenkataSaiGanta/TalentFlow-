// src/views/CandidateProfile.jsx
import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import { stages } from '../db'
import Toast from '../components/Toast'

const fmt = (ts)=> new Date(ts).toLocaleString()

export default function CandidateProfile({ params, navigate }) {
  const candId = Number(params?.id || window.location.pathname.split('/').pop())
  const [cand, setCand] = useState(null)
  const [allNames, setAllNames] = useState([]) // for @mentions suggestions
  const [note, setNote] = useState('')
  const [suggest, setSuggest] = useState([]) // array of names
  const [toast, setToast] = useState('')
  const [kind, setKind] = useState('success')

  useEffect(() => {
    api(`/candidates/${candId}`).then(setCand)
    // pull a small roster for mentions
    api('/candidates?pageSize=2000').then(r => setAllNames((r.items||[]).map(c => `${c.name}`)))
  }, [candId])

  const history = useMemo(() => {
    const arr = Array.isArray(cand?.history) ? cand.history.slice() : []
    arr.sort((a,b)=> (a.at||0)-(b.at||0))
    return arr
  }, [cand])

  function onChangeNote(v) {
    setNote(v)
    const atIdx = v.lastIndexOf('@')
    if (atIdx < 0) return setSuggest([])
    const frag = v.slice(atIdx + 1).trim().toLowerCase()
    if (!frag) return setSuggest([])
    const matches = allNames.filter(n => n.toLowerCase().includes(frag)).slice(0, 6)
    setSuggest(matches)
  }

  function applySuggestion(name) {
    const atIdx = note.lastIndexOf('@')
    if (atIdx < 0) return
    const before = note.slice(0, atIdx + 1)
    setNote(`${before}${name} `)
    setSuggest([])
  }

  async function addNote(e) {
    e.preventDefault()
    const text = note.trim()
    if (!text) return
    setNote('')
    try {
      const updated = await api(`/candidates/${candId}`, {
        method: 'PATCH',
        body: JSON.stringify({ addNote: { text } })
      })
      setCand(updated)
      setKind('success'); setToast('Note added')
    } catch {
      setKind('error'); setToast('Failed to add note')
    } finally {
      setTimeout(()=>setToast(''), 1100)
    }
  }

  if (!cand) return <div className="container-md py-6 text-sm text-slate-500">Loading…</div>

  const stageLabel = (stages.find(s=>s.id===cand.stage)||{}).label || cand.stage

  return (
    <div className="container-md py-6 space-y-6">
      <div className="flex items-center justify-between">
        <button className="btn-ghost" onClick={()=>navigate('/candidates')}>← Back</button>
        <div className="text-sm text-slate-500">ID #{cand.id}</div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{cand.name}</h1>
            <div className="text-sm text-slate-600">{cand.email}</div>
          </div>
          <div className="pill">{stageLabel}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="card p-5">
          <div className="font-medium mb-3">Timeline</div>
          <ol className="relative border-l pl-4">
            {history.length === 0 && <div className="text-sm text-slate-500">No history</div>}
            {history.map((h,i)=>(
              <li key={i} className="mb-4">
                <div className="text-sm">
                  Moved to <span className="font-medium">{(stages.find(s=>s.id===h.stage)||{}).label || h.stage}</span>
                </div>
                <div className="text-xs text-slate-500">{fmt(h.at)}</div>
              </li>
            ))}
          </ol>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <div className="font-medium mb-3">Notes</div>
          <div className="space-y-2">
            {(cand.notes||[]).length === 0 && <div className="text-sm text-slate-500">No notes yet</div>}
            {(cand.notes||[]).map((n, i)=>(
              <div key={i} className="p-3 border rounded-xl text-sm bg-slate-50">{n}</div>
            ))}
          </div>

          <form className="mt-4" onSubmit={addNote}>
            <label className="block text-xs text-slate-500 mb-1">Add a note (type @ to mention)</label>
            <div className="relative">
              <textarea
                className="textarea"
                rows={3}
                value={note}
                onChange={e=>onChangeNote(e.target.value)}
                placeholder="E.g., @Jane reviewed the assignment."
              />
              {suggest.length > 0 && (
                <div className="absolute bottom-[calc(100%+4px)] left-0 right-0 card p-2 max-h-48 overflow-auto">
                  {suggest.map(s => (
                    <button
                      key={s}
                      type="button"
                      className="w-full text-left px-2 py-1 rounded-lg hover:bg-slate-100"
                      onClick={()=>applySuggestion(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-2">
              <button className="btn-primary">Add note</button>
            </div>
          </form>
        </div>
      </div>

      <Toast msg={toast} kind={kind} />
    </div>
  )
}
