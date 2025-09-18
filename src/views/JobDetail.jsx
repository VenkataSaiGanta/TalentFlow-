import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function JobDetail({ match }) {
  const { id } = match
  const [job, setJob] = useState(null)
  useEffect(()=>{ api(`/jobs?byId=${id}`).then(d=> setJob(d.items?.[0] || null)) }, [id])
  if (!job) return <div className="container-xl py-6">Loading…</div>
  return (
    <div className="container-xl py-6">
      <h1 className="text-2xl font-semibold">{job.title}</h1>
      <div className="text-sm text-slate-500">/{job.slug}</div>
      <div className="mt-4">
        <div className="text-sm">Status: <span className="px-2 py-1 rounded-lg bg-slate-100">{job.status}</span></div>
        <div className="mt-2 flex gap-2">
          {job.tags.map(t=> <span key={t} className="text-xs bg-slate-100 px-2 py-1 rounded-lg">{t}</span>)}
        </div>
      </div>
      <div className="mt-6">
        <a className="underline text-slate-700" href="/assessments">Open assessment builder for this job</a>
      </div>
    </div>
  )
}
