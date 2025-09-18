export function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g,'')
}
export function uniqueSlug(slug, jobs, editingId=null) {
  return !jobs.some(j => j.slug === slug && j.id !== editingId)
}

/** Validate answers given a schema; returns { errors, firstErrorId } */
export function validateAnswers(schema, answers) {
  const errors = {}
  const visible = {}
  // precompute visibility
  for (const sec of schema.sections || []) {
    for (const q of sec.questions || []) {
      visible[q.id] = isVisible(q, answers)
    }
  }
  for (const sec of schema.sections || []) {
    for (const q of sec.questions || []) {
      if (!visible[q.id]) continue
      const v = answers[q.id]
      const req = !!q.required
      if (req) {
        if (q.type === 'multi' && Array.isArray(v) && v.length === 0) errors[q.id] = 'This field is required.'
        else if ((v === undefined || v === null || v === '') && q.type !== 'multi') errors[q.id] = 'This field is required.'
      }
      if (q.type === 'number' && v !== '' && v !== undefined && v !== null) {
        const n = Number(v)
        if (Number.isNaN(n)) errors[q.id] = 'Enter a valid number.'
        if (q.min !== undefined && n < Number(q.min)) errors[q.id] = `Must be ≥ ${q.min}.`
        if (q.max !== undefined && n > Number(q.max)) errors[q.id] = `Must be ≤ ${q.max}.`
      }
      if ((q.type === 'short' || q.type === 'long') && typeof v === 'string') {
        if (q.maxLength && v.length > Number(q.maxLength)) errors[q.id] = `Max ${q.maxLength} characters.`
        if (q.pattern) {
          try {
            const re = new RegExp(q.pattern)
            if (!re.test(v)) errors[q.id] = 'Invalid format.'
          } catch {}
        }
      }
    }
  }
  const firstErrorId = Object.keys(errors)[0] || null
  return { errors, firstErrorId }
}

export function isVisible(q, answers) {
  if (!q.showIf) return true
  const { qId, equals } = q.showIf
  return String(answers[qId] ?? '') === String(equals)
}
