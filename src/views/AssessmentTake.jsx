import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import AssessmentField from '../components/AssessmentField'
import { isVisible, validateAssessment } from '../utils/formRuntime'
import Toast from '../components/Toast'

export default function AssessmentTake({ params }) {
  const jobId = params?.jobId || window.location.pathname.split('/').filter(Boolean).slice(-2, -1)[0]
  const [schema, setSchema] = useState({ sections: [] })
  const [answers, setAnswers] = useState({})
  const [errors, setErrors] = useState({})
  const [toast, setToast] = useState('')
  const [kind, setKind] = useState('success')

  useEffect(()=>{ api(`/assessments/${jobId}`).then(setSchema) }, [jobId])

  // Clear errors for hidden questions
  const visibleIds = useMemo(()=>{
    const set = new Set()
    for (const s of schema.sections||[]) {
      for (const q of s.questions||[]) {
        if (isVisible(q, answers)) set.add(q.id)
      }
    }
    return set
  }, [schema, answers])

  useEffect(()=>{
    setErrors(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => { if (!visibleIds.has(k)) delete next[k] })
      return next
    })
  }, [visibleIds])

  async function submit(e) {
    e.preventDefault()
    const { errors: errs, firstErrorId } = validateAssessment(schema, answers)
    if (Object.keys(errs).length) {
      setErrors(errs)
      const el = document.querySelector(`[data-qid="${firstErrorId}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setKind('error'); setToast('Please fix highlighted fields')
      setTimeout(()=>setToast(''), 1400)
      return
    }
    try {
      await api(`/assessments/${jobId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers, candidateId: null })
      })
      setKind('success'); setToast('Submitted')
      setAnswers({})
    } catch {
      setKind('error'); setToast('Submit failed')
    } finally {
      setTimeout(()=>setToast(''), 1400)
    }
  }

  return (
    <div className="container-md py-6">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Assessment</h1>
          <a className="btn-ghost" href="/assessments" onClick={(e)=>{ e.preventDefault(); history.back() }}>← Back</a>
        </div>

        <form className="mt-4 space-y-6" onSubmit={submit}>
          {(schema.sections || []).map(sec => (
            <section key={sec.id} className="space-y-4">
              <h2 className="text-base font-medium">{sec.title}</h2>
              {(sec.questions || []).map(q => {
                if (!isVisible(q, answers)) return null
                return (
                  <div key={q.id} data-qid={q.id}>
                    <AssessmentField
                      q={q}
                      value={answers[q.id]}
                      onChange={(v)=>setAnswers(a=>({ ...a, [q.id]: v }))}
                      error={errors[q.id] || null}
                    />
                  </div>
                )
              })}
            </section>
          ))}

          <div className="pt-2">
            <button className="btn-primary">Submit</button>
          </div>
        </form>
      </div>
      <Toast msg={toast} kind={kind} />
    </div>
  )
}
