// src/db.js
import Dexie from 'dexie'
export const db = new Dexie('talentflow')

db.version(3).stores({
  jobs: '++id',
  candidates: '++id',
  assessments: '++id',
  responses: '++id'
}).upgrade(async tx => {
  const t = tx.table('jobs')
  const all = await t.toArray()
  all.sort((a,b)=> (+a.order||0) - (+b.order||0))
  for (let i=0;i<all.length;i++) {
    const j = all[i]
    if (!Number.isFinite(+j.order)) j.order = i
    if (typeof j.slug !== 'string') j.slug = String(j.slug ?? '')
    if (typeof j.status !== 'string') j.status = 'active'
  }
  await t.bulkPut(all)
})

// Stages (used in Candidates UI)
export const stages = [
  { id: 'applied',   label: 'Applied' },
  { id: 'screening', label: 'Screening' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer',     label: 'Offer' },
  { id: 'hired',     label: 'Hired' },
  { id: 'rejected',  label: 'Rejected' },
]
