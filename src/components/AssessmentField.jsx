import React from 'react'

export default function AssessmentField({ q, value, onChange, error }) {
  const Label = () => (
    <label className="block text-sm font-medium mb-1">
      {q.label || 'Untitled'}
      {q.required && <span className="ml-1 text-rose-600">*</span>}
      {q.help && <span className="ml-2 text-xs text-slate-500">{q.help}</span>}
    </label>
  )

  const base = "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
  const err = error ? 'border-rose-400' : 'border-slate-200'

  if (q.type === 'short') {
    return (
      <div>
        <Label />
        <input
          className={`${base} ${err}`}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          maxLength={q.maxLength || undefined}
          placeholder={q.placeholder || ''}
        />
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    )
  }

  if (q.type === 'long') {
    return (
      <div>
        <Label />
        <textarea
          className={`${base} ${err}`}
          rows={q.rows || 4}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          maxLength={q.maxLength || undefined}
          placeholder={q.placeholder || ''}
        />
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    )
  }

  if (q.type === 'number') {
    return (
      <div>
        <Label />
        <input
          type="number"
          className={`${base} ${err}`}
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          min={q.min ?? undefined}
          max={q.max ?? undefined}
          placeholder={q.placeholder ?? ''}
        />
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    )
  }

  if (q.type === 'single') {
    return (
      <div>
        <Label />
        <div className="flex flex-wrap gap-2">
          {(q.options || []).map(opt => (
            <label key={opt} className={`selectable ${value===opt ? 'selected' : ''}`}>
              <input
                type="radio"
                className="hidden"
                name={q.id}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    )
  }

  if (q.type === 'multi') {
    const arr = Array.isArray(value) ? value : []
    const toggle = (opt) => {
      if (arr.includes(opt)) onChange(arr.filter(x => x !== opt))
      else onChange([...arr, opt])
    }
    return (
      <div>
        <Label />
        <div className="flex flex-wrap gap-2">
          {(q.options || []).map(opt => (
            <label key={opt} className={`selectable ${arr.includes(opt) ? 'selected' : ''}`}>
              <input
                type="checkbox"
                className="hidden"
                checked={arr.includes(opt)}
                onChange={() => toggle(opt)}
              />
              {opt}
            </label>
          ))}
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    )
  }

  if (q.type === 'file') {
    const display = value ? `${value.name} (${value.size||0} bytes)` : 'No file chosen'
    return (
      <div>
        <Label />
        <div className="flex items-center gap-3">
          <input
            type="file"
            className="hidden"
            id={`file-${q.id}`}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (!f) return onChange(null)
              onChange({ name: f.name, size: f.size, type: f.type }) // stub
            }}
          />
          <label htmlFor={`file-${q.id}`} className="btn-secondary">Choose file</label>
          <span className="text-sm text-slate-600">{display}</span>
        </div>
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    )
  }

  return null
}
