import React, { useEffect, useMemo, useRef, useState } from 'react'
import AssessmentField from './AssessmentField'
import { isVisible, validateAssessment } from '../utils/formRuntime'
import { api } from '../api'

function keyFor(jobId) {
  return `assessment:draft:${jobId ?? 'unknown'}`
}

export default function AssessmentPreview({ schema, jobId, candidateId, onSubmitted }) {
  const [answers, setAnswers] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [msg, setMsg] = useState('')
  const [kind, setKind] = useState('info') // 'success' | 'error' | 'info'
  const saveTimer = useRef(null)

  // Restore draft on mount / when job changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(keyFor(jobId))
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed === 'object') {
          setAnswers(parsed.answers || {})
          setSavedAt(parsed.savedAt || null)
        }
      }
    } catch {}
    
  }, [jobId])

  // Validate only for currently visible questions
  const visibleQuestions = useMemo(() => {
    const map = new Map()
    for (const sec of schema?.sections || []) {
      for (const q of sec.questions || []) {
        if (isVisible(q, answers)) map.set(q.id, q)
      }
    }
    return map
  }, [schema, answers])

  const validation = useMemo(() => validateAssessment(schema, answers), [schema, answers])
  const errors = useMemo(() => {
    // Keep only errors for currently visible questions
    const out = {}
    for (const [qid, err] of Object.entries(validation.errors || {})) {
      if (visibleQuestions.has(qid)) out[qid] = err
    }
    return out
  }, [validation, visibleQuestions])

  // Debounced local draft save whenever answers change
  useEffect(() => {
    if (!schema) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        setSaving(true)
        const payload = { answers, savedAt: Date.now(), jobId }
        localStorage.setItem(keyFor(jobId), JSON.stringify(payload))
        setSavedAt(payload.savedAt)
      } catch {}
      setSaving(false)
    }, 350)
    return () => clearTimeout(saveTimer.current)
  }, [answers, jobId, schema])

  function setFieldValue(id, v) {
    setAnswers(a => ({ ...a, [id]: v }))
    if (msg) setMsg('')
  }

  async function handleSubmit(e) {
    e?.preventDefault?.()
    // Re-run validation and block submit if errors exist
    const hasErrors = Object.keys(errors).length > 0
    if (hasErrors) {
      setKind('error')
      setMsg('Please fix the highlighted fields.')
      return
    }
    if (!jobId && typeof jobId !== 'number') {
      setKind('error')
      setMsg('Cannot submit: missing jobId.')
      return
    }

    setSubmitting(true)
    setKind('info')
    setMsg('Submitting…')

    try {
      //   have the MSW handler: POST /assessments/:jobId/submit
      await api(`/assessments/${jobId}/submit`, {
        method: 'POST',
        body: {
          answers,
          candidateId: candidateId ?? null,
          meta: { clientAt: Date.now(), userAgent: navigator.userAgent }
        }
      })

      // Clear draft on successful submit
      try { localStorage.removeItem(keyFor(jobId)) } catch {}

      setKind('success')
      setMsg('Submitted! Response saved locally.')
      if (typeof onSubmitted === 'function') onSubmitted({ jobId, candidateId, answers })

      // reset form after submit
      // setAnswers({})
    } catch (err) {
      setKind('error')
      setMsg(err?.message || 'Submit failed')
    } finally {
      setSubmitting(false)
      setTimeout(() => setMsg(''), 1800)
    }
  }

  function handleSaveDraft() {
    try {
      const when = Date.now()
      localStorage.setItem(keyFor(jobId), JSON.stringify({ answers, savedAt: when, jobId }))
      setSavedAt(when)
      setKind('success'); setMsg('Draft saved.')
      setTimeout(() => setMsg(''), 1200)
    } catch {
      setKind('error'); setMsg('Could not save draft.')
      setTimeout(() => setMsg(''), 1600)
    }
  }

  function handleClear() {
    setAnswers({})
    try { localStorage.removeItem(keyFor(jobId)) } catch {}
    setSavedAt(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Live preview</h3>
          {savedAt && (
            <span className="text-[11px] text-slate-500">
              Draft saved {new Date(savedAt).toLocaleString()}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500">
          Fill to test visibility & rules
          {saving ? ' • saving…' : ''}
        </span>
      </div>

      {/* Status message */}
      {msg ? (
        <div
          className={[
            'text-sm rounded-lg px-3 py-2',
            kind === 'success' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            kind === 'error' && 'bg-rose-50 text-rose-700 border border-rose-200',
            kind === 'info' && 'bg-sky-50 text-sky-700 border border-sky-200'
          ].filter(Boolean).join(' ')}
        >
          {msg}
        </div>
      ) : null}

      {/* Sections + fields */}
      {schema?.sections?.length ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {schema.sections.map(sec => (
            <div key={sec.id} className="card p-4">
              <div className="font-medium mb-3">{sec.title || 'Untitled section'}</div>
              <div className="space-y-4">
                {(sec.questions || [])
                  .filter(q => isVisible(q, answers))
                  .map(q => (
                    <AssessmentField
                      key={q.id}
                      q={q}
                      value={answers[q.id]}
                      onChange={(v) => setFieldValue(q.id, v)}
                      error={errors[q.id] || null}
                    />
                  ))}
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="sticky bottom-0 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t py-3 px-2 rounded-b-xl flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200"
            >
              Save draft
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-3 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="ml-auto px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit response'}
            </button>
          </div>
        </form>
      ) : (
        <div className="text-sm text-slate-500">No sections yet.</div>
      )}
    </div>
  )
}
