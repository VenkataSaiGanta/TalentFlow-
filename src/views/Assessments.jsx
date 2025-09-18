import React, { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import Toast from '../components/Toast'
import AssessmentPreview from '../components/AssessmentPreview'
import { isVisible } from '../utils/formRuntime'

const nid = () => (crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2))

export default function Assessments() {
  const [jobs, setJobs] = useState([])
  const [jobId, setJobId] = useState('')
  const [schema, setSchema] = useState({ sections: [] })
  const [toast, setToast] = useState('')
  const [kind, setKind] = useState('success')
  const saveTimer = useRef(null)

  // load jobs
  useEffect(() => {
    fetch('/jobs?check=all').then(r => r.json()).then(res => {
      setJobs(res.items || [])
      if (res.items?.[0]) setJobId(String(res.items[0].id))
    })
  }, [])

  // load assessment for job
  useEffect(() => {
    if (!jobId) return
    api(`/assessments/${jobId}`).then(a => setSchema(a || { sections: [] }))
  }, [jobId])

  // auto-save (debounced)
  useEffect(() => {
    if (!jobId) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await api(`/assessments/${jobId}`, { method: 'PUT', body: JSON.stringify(schema) })
        setKind('success'); setToast('Saved')
      } catch {
        setKind('error'); setToast('Save failed')
      } finally {
        setTimeout(() => setToast(''), 1100)
      }
    }, 500)
    return () => clearTimeout(saveTimer.current)
  }, [schema, jobId])

  function addSection() {
    setSchema(s => ({
      ...s,
      sections: [...(s.sections || []), { id: nid(), title: 'New section', questions: [] }]
    }))
  }
  function updateSection(id, patch) {
    setSchema(s => {
      const copy = structuredClone(s)
      const sec = copy.sections.find(x => x.id === id)
      if (!sec) return s
      Object.assign(sec, patch)
      return copy
    })
  }
  function deleteSection(id) {
    setSchema(s => ({ ...s, sections: (s.sections || []).filter(sec => sec.id !== id) }))
  }

  function addQuestion(sectionId, type) {
    setSchema(s => {
      const copy = structuredClone(s)
      const sec = copy.sections.find(x => x.id === sectionId)
      if (!sec) return s
      sec.questions.push(baseQuestion(type))
      return copy
    })
  }
  function updateQuestion(sectionId, qId, patch) {
    setSchema(s => {
      const copy = structuredClone(s)
      const sec = copy.sections.find(x => x.id === sectionId)
      if (!sec) return s
      const q = sec.questions.find(x => x.id === qId)
      if (!q) return s
      Object.assign(q, patch)
      return copy
    })
  }
  function deleteQuestion(sectionId, qId) {
    setSchema(s => {
      const copy = structuredClone(s)
      const sec = copy.sections.find(x => x.id === sectionId)
      if (!sec) return s
      sec.questions = sec.questions.filter(x => x.id !== qId)
      return copy
    })
  }

  // questions that appear before qId (for showIf “Based on”)
  function priorQuestionsOf(qId) {
    const acc = []
    for (const sec of schema.sections || []) {
      for (const q of sec.questions || []) {
        if (q.id === qId) return acc
        acc.push(q)
      }
    }
    return acc
  }

  return (
    <div className="container-xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Assessments</h1>
        <div className="flex items-center gap-2">
          <select className="select" value={jobId} onChange={e => setJobId(e.target.value)}>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          {jobId && (
            <a
              className="btn-secondary"
              href={`/assessments/${jobId}/take`}
              onClick={(e)=>{ e.preventDefault(); window.history.pushState({}, '', `/assessments/${jobId}/take`); window.dispatchEvent(new PopStateEvent('popstate'))}}
            >Open Live Form</a>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Builder */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Builder</div>
                <div className="text-xs text-slate-500">Add sections & questions. Simple rules and validation.</div>
              </div>
              <button onClick={addSection} className="btn-primary">+ Section</button>
            </div>
          </div>

          {(schema.sections || []).map(sec => (
            <div key={sec.id} className="card p-4 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  className="input"
                  value={sec.title}
                  onChange={(e)=>updateSection(sec.id, { title: e.target.value })}
                />
                <button className="btn-ghost" onClick={()=>deleteSection(sec.id)}>Remove</button>
              </div>

              {(sec.questions || []).length === 0 && (
                <div className="text-sm text-slate-500">No questions yet. Add one below.</div>
              )}

              <div className="space-y-3">
                {(sec.questions || []).map(q => (
                  <div key={q.id} className="border rounded-xl p-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      {/* Left: core config */}
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Question label</label>
                          <input className="input" value={q.label} onChange={e=>updateQuestion(sec.id, q.id, { label: e.target.value })} placeholder="e.g., What is your experience?" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Type</label>
                            <select
                              className="select"
                              value={q.type}
                              onChange={e=>updateQuestion(sec.id, q.id, resetForType(q, e.target.value))}
                            >
                              <option value="single">Single choice</option>
                              <option value="multi">Multi choice</option>
                              <option value="short">Short text</option>
                              <option value="long">Long text</option>
                              <option value="number">Number (range)</option>
                              <option value="file">File upload (stub)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Required</label>
                            <button
                              type="button"
                              onClick={()=>updateQuestion(sec.id, q.id, { required: !q.required })}
                              className={`switch ${q.required ? 'on' : 'off'}`}
                            >
                              <span className="switch-dot" />
                            </button>
                          </div>
                        </div>

                        { (q.type === 'short' || q.type === 'long') && (
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Max length</label>
                              <input className="input" type="number" value={q.maxLength ?? ''} onChange={e=>updateQuestion(sec.id, q.id, { maxLength: e.target.value===''? undefined : Number(e.target.value) })} />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-xs text-slate-500 mb-1">Pattern (regex)</label>
                              <input className="input" value={q.pattern || ''} onChange={e=>updateQuestion(sec.id, q.id, { pattern: e.target.value })} placeholder="^\\S+@\\S+\\.\\S+$" />
                            </div>
                          </div>
                        )}

                        { q.type === 'number' && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Min</label>
                              <input className="input" type="number" value={q.min ?? ''} onChange={e=>updateQuestion(sec.id, q.id, { min: e.target.value===''? undefined : Number(e.target.value) })} />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-500 mb-1">Max</label>
                              <input className="input" type="number" value={q.max ?? ''} onChange={e=>updateQuestion(sec.id, q.id, { max: e.target.value===''? undefined : Number(e.target.value) })} />
                            </div>
                          </div>
                        )}

                        {(q.type === 'single' || q.type === 'multi') && (
                          <OptionEditor
                            options={q.options || []}
                            onChange={(opts)=>updateQuestion(sec.id, q.id, { options: opts })}
                          />
                        )}

                        <div>
                          <label className="block text-xs text-slate-500 mb-1">Help text (optional)</label>
                          <input className="input" value={q.help || ''} onChange={e=>updateQuestion(sec.id, q.id, { help: e.target.value })} placeholder="Shown under the label" />
                        </div>
                      </div>

                      {/* Right: very simple conditional */}
                      <div className="space-y-2">
                        <div className="text-xs text-slate-500">Show this question only when…</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Based on</label>
                            <select
                              className="select"
                              value={q.showIf?.qId || ''}
                              onChange={(e)=>{
                                const v = e.target.value
                                if (!v) updateQuestion(sec.id, q.id, { showIf: undefined })
                                else updateQuestion(sec.id, q.id, { showIf: { qId: v, equals: '' } })
                              }}
                            >
                              <option value="">(always show)</option>
                              {priorQuestionsOf(q.id).map(pq => (
                                <option key={pq.id} value={pq.id}>{pq.label || pq.id}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Equals</label>
                            {(() => {
                              const controlling = priorQuestionsOf(q.id).find(p => p.id === q.showIf?.qId)
                              // If controller is choice-type, offer dropdown of its options. Else free text.
                              if (controlling && (controlling.type === 'single' || controlling.type === 'multi')) {
                                return (
                                  <select
                                    className="select"
                                    value={q.showIf?.equals ?? ''}
                                    onChange={(e)=>updateQuestion(sec.id, q.id, { showIf: { qId: q.showIf.qId, equals: e.target.value } })}
                                  >
                                    <option value="">{'(none)'}</option>
                                    {(controlling.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                  </select>
                                )
                              }
                              return (
                                <input
                                  className="input"
                                  placeholder="Yes"
                                  value={q.showIf?.equals ?? ''}
                                  onChange={(e)=>updateQuestion(sec.id, q.id, { showIf: { qId: q.showIf?.qId, equals: e.target.value } })}
                                />
                              )
                            })()}
                          </div>
                        </div>

                        {q.showIf?.qId && (
                          <p className="text-[11px] text-slate-500">
                            This question is visible only if <span className="font-medium">{(priorQuestionsOf(q.id).find(p => p.id === q.showIf.qId)?.label) || q.showIf.qId}</span> = <code>{q.showIf.equals || '(empty)'}</code>.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-slate-50 rounded border">{q.type}</span>
                      <button className="btn-ghost" onClick={()=>deleteQuestion(sec.id, q.id)}>Delete question</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <AddQ onAdd={(t)=>addQuestion(sec.id, t)} />
              </div>
            </div>
          ))}
        </div>

        {/* Live preview */}
        <div className="space-y-4">
          <AssessmentPreview schema={schema} jobId={jobId}  />
          <div className="text-xs text-slate-500">Tip: Use the Live Form to experience validation and conditional logic end-to-end.</div>
        </div>
      </div>

      <Toast msg={toast} kind={kind} />
    </div>
  )
}

function AddQ({ onAdd }) {
  const types = [
    ['single','Single choice'],
    ['multi','Multi choice'],
    ['short','Short text'],
    ['long','Long text'],
    ['number','Number (range)'],
    ['file','File upload (stub)'],
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {types.map(([t, label])=>(
        <button key={t} className="btn-secondary" onClick={()=>onAdd(t)}>{label}</button>
      ))}
    </div>
  )
}

function OptionEditor({ options, onChange }) {
  const [val, setVal] = useState('')
  function add() {
    const v = val.trim()
    if (!v) return
    if (options.includes(v)) return
    onChange([...(options||[]), v])
    setVal('')
  }
  function remove(o) {
    onChange((options||[]).filter(x => x !== o))
  }
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">Options</label>
      <div className="flex gap-2">
        <input className="input" value={val} onChange={e=>setVal(e.target.value)} placeholder="Type an option and Add" />
        <button type="button" className="btn-secondary" onClick={add}>Add</button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {(options||[]).map(o => (
          <span key={o} className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl text-xs">
            {o}
            <button type="button" className="text-slate-500 hover:text-rose-600" onClick={()=>remove(o)}>×</button>
          </span>
        ))}
      </div>
    </div>
  )
}

function baseQuestion(type) {
  const common = { id: nid(), type, label: 'Untitled question', required: false }
  if (type === 'single') return { ...common, options: ['Yes', 'No'] }
  if (type === 'multi')  return { ...common, options: ['Option A', 'Option B'] }
  if (type === 'short')  return { ...common, maxLength: 120, pattern: '' }
  if (type === 'long')   return { ...common, maxLength: 600 }
  if (type === 'number') return { ...common, min: 0, max: 50 }
  if (type === 'file')   return { ...common }
  return common
}

function resetForType(q, newType) {
  // Keep label/required/help; reset type-specific fields
  const common = { label: q.label, required: q.required, help: q.help }
  if (newType === 'single') return { ...common, type: 'single', options: ['Yes', 'No'], showIf: q.showIf }
  if (newType === 'multi')  return { ...common, type: 'multi', options: ['Option A', 'Option B'], showIf: q.showIf }
  if (newType === 'short')  return { ...common, type: 'short', maxLength: 120, pattern: '', showIf: q.showIf }
  if (newType === 'long')   return { ...common, type: 'long', maxLength: 600, showIf: q.showIf }
  if (newType === 'number') return { ...common, type: 'number', min: 0, max: 50, showIf: q.showIf }
  if (newType === 'file')   return { ...common, type: 'file', showIf: q.showIf }
  return { ...q, type: newType }
}
