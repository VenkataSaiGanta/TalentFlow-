// Visibility + validation used by Preview and Runtime

export function isVisible(q, answers) {
  if (!q?.showIf) return true
  const { qId, equals } = q.showIf
  if (!qId) return true
  const val = answers[qId]
  // support both scalar and array answers
  if (Array.isArray(val)) return val.map(String).includes(String(equals))
  return String(val) === String(equals)
}

export function validateQuestion(q, value) {
  if (!q) return null
  const req = !!q.required
  const t = q.type

  if (req) {
    if (t === 'multi') {
      if (!Array.isArray(value) || value.length === 0) return 'Required'
    } else if (value === '' || value === null || value === undefined) {
      return 'Required'
    }
  }

  if ((t === 'short' || t === 'long') && value) {
    if (q.maxLength && String(value).length > Number(q.maxLength)) {
      return `Max length ${q.maxLength}`
    }
    if (q.pattern) {
      try {
        const re = new RegExp(q.pattern)
        if (!re.test(String(value))) return 'Invalid format'
      } catch { /* invalid regex entered in builder */ }
    }
  }

  if (t === 'number' && value !== '' && value !== null && value !== undefined) {
    const n = Number(value)
    if (!Number.isFinite(n)) return 'Must be a number'
    if (q.min !== undefined && n < Number(q.min)) return `Min ${q.min}`
    if (q.max !== undefined && n > Number(q.max)) return `Max ${q.max}`
  }

  return null
}

export function validateAssessment(schema, answers) {
  const errors = {}
  let firstErrorId = null
  for (const s of schema.sections || []) {
    for (const q of s.questions || []) {
      if (!isVisible(q, answers)) continue
      const err = validateQuestion(q, answers[q.id])
      if (err) {
        errors[q.id] = err
        if (!firstErrorId) firstErrorId = q.id
      }
    }
  }
  return { errors, firstErrorId }
}
