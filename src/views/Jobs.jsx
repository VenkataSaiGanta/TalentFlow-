import React, { useEffect, useRef, useState } from 'react'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import TagInput from '../components/TagInput'
import Toast from '../components/Toast'
import { api } from '../api'
import { slugify, uniqueSlug } from '../utils/validation'

export default function Jobs({ navigate }) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [tags, setTags] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(9)
  const [sort, setSort] = useState('order')
  const [data, setData] = useState({ items: [], total: 0 })
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState('')
  const [toastKind, setToastKind] = useState('success')

  // drag state
  const dragItem = useRef(null) 
  const [hoverIdx, setHoverIdx] = useState(null)

  async function load() {
    const res = await api(
      `/jobs?search=${encodeURIComponent(q)}&status=${status}&tags=${encodeURIComponent(
        tags
      )}&page=${page}&pageSize=${pageSize}&sort=${sort}`
    )
    setData(res)
  }
  useEffect(() => { load() }, [q, status, tags, page, pageSize, sort])

  
  useEffect(() => { setHoverIdx(null) }, [data.items])

  function onDragStart(idx, job) {
    dragItem.current = { idx, job }
  }
  function onDragEnd() {
    setHoverIdx(null)
    dragItem.current = null
  }

  function handleDragOver(idx, e) {
    e.preventDefault()
    setHoverIdx(idx) 
  }

  
  function moveAtSlot(arr, from, to) {
    const copy = [...arr]
    const [m] = copy.splice(from, 1)
    copy.splice(to, 0, m)
    return copy
  }

  async function onDrop(idx, targetJob, e) {
    const source = dragItem.current
    if (!source || !targetJob || source.job.id === targetJob.id) return

    // Reordering 
    if (sort !== 'order') {
      setToastKind('error'); setToast('Switch Sort to "Manual Order" to drag & drop.')
      setTimeout(() => { setToast(''); setToastKind('success') }, 1400)
      onDragEnd()
      return
    }

    // ----- OPTIMISTIC: insert at the hovered "slot" index -----
    setData(d => {
      const list = [...d.items]
      const from = list.findIndex(j => j.id === source.job.id) 
      if (from === -1) return d
      // if dragging from above, removing shifts the slot left by 1; account for that
      const insertAt = from < idx ? Math.max(0, idx - 1) : idx
      const next = moveAtSlot(list, from, insertAt)
      return { ...d, items: next }
    })
    setToast('Reordering…')
    console.log("hello man 1");
    try {
      // ----- PERSIST (global): prefer index-based API { fromOrder, toOrder } -----
      let fromOrder = Number(source.job.order)
      let targetOrder = Number(targetJob.order)
       console.log("hello man 2");
      
      if (!Number.isFinite(fromOrder) || !Number.isFinite(targetOrder)) {
         console.log("hello man 3");
        const all = await api('/jobs?check=all')
        const list = (all.items || [])
          .map((j, i) => ({ ...j, order: Number.isFinite(j.order) ? Number(j.order) : i }))
          .sort((a, b) => a.order - b.order)

        const srcIdx = list.findIndex(j => Number(j.id) === Number(source.job.id))
        const tgtIdx = list.findIndex(j => Number(j.id) === Number(targetJob.id))
        fromOrder = srcIdx < 0 ? 0 : srcIdx
        targetOrder = tgtIdx < 0 ? list.length - 1 : tgtIdx
      }

      
      const toOrder = fromOrder < targetOrder ? targetOrder - 1 : targetOrder
        
      await api(`/jobs/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ id: Number(source.job.id), fromOrder, toOrder })
      })

      setToast('Reordered')
      load() 
    } catch (err) {
       console.log("hello man 4");
      console.log("hello man 4",err);
      setToastKind('error'); setToast('Reorder failed — rolled back')
      await load()
    } finally {
      setTimeout(() => { setToast(''); setToastKind('success') }, 1400)
      onDragEnd()
    }
  }

  function openCreate() { setEditing(null); setOpen(true) }
  function openEdit(job) { setEditing(job); setOpen(true) }

  async function saveJob(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const title = fd.get('title').trim()
    const slug = slugify(fd.get('slug').trim() || title)
    const t = (fd.get('tags') || '').split(',').map(s => s.trim()).filter(Boolean)
    const body = { title, slug, tags: t }
    if (!title) return alert('Title is required')

    const method = editing ? 'PATCH' : 'POST'
    const url = editing ? `/jobs/${editing.id}` : '/jobs'
    try {
      await api(url, { method, body: JSON.stringify(body) })
      setOpen(false); setToast('Saved'); load()
    } catch (err) {
      setToastKind('error'); setToast(err.message)
    } finally {
      setTimeout(() => { setToast(''); setToastKind('success') }, 1400)
    }
  }

  async function toggleArchive(job) {
    const prev = data.items
    const next = prev.map(j => j.id === job.id ? { ...j, status: job.status === 'archived' ? 'active' : 'archived' } : j)
    setData(d => ({ ...d, items: next }))
    try {
      await api(`/jobs/${job.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: job.status === 'archived' ? 'active' : 'archived' }),
      })
      setToast('Status updated')
    } catch (e) {
      setData(d => ({ ...d, items: prev }))
      setToastKind('error'); setToast('Update failed — rolled back')
    } finally {
      setTimeout(() => { setToast(''); setToastKind('success') }, 1400)
    }
  }

  return (
    <div className="container-xl py-6">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500">Search title</label>
            <input
              value={q}
              onChange={e => { setQ(e.target.value); setPage(1) }}
              className="border rounded-lg px-3 py-2 w-64"
              placeholder="e.g. Frontend Engineer"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Status</label>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1) }}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500">Tags (comma)</label>
            <input
              value={tags}
              onChange={e => { setTags(e.target.value); setPage(1) }}
              className="border rounded-lg px-3 py-2 w-56"
              placeholder="react, remote"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Sort</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="border rounded-lg px-3 py-2"
              title='Choose "Manual Order" to enable drag & drop'
            >
              <option value="order">Manual Order</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Pagination page={page} pageSize={pageSize} total={data.total} onPage={setPage} />
          <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-slate-900 text-white">+ New Job</button>
        </div>
      </div>

      {data.items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <div className="text-lg font-medium">No jobs found</div>
          <p className="text-sm mt-1 text-slate-600">Create a job or reload to allow demo data to seed.</p>
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={openCreate} className="px-4 py-2 rounded-xl bg-slate-900 text-white">+ New Job</button>
            <button onClick={()=>location.reload()} className="px-4 py-2 rounded-xl bg-slate-100">Reload</button>
          </div>
        </div>
      ) : (
        <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((job, idx) => {
            const highlight = hoverIdx === idx
            return (
              <li
                key={job.id}
                draggable
                onDragStart={() => onDragStart(idx, job)}
                onDragEnd={onDragEnd}
                onDragOver={(e) => handleDragOver(idx, e)}
                onDrop={(e) => onDrop(idx, job, e)}
                className={`bg-white rounded-2xl shadow-soft border p-4 transition hover:-translate-y-0.5 hover:shadow-lg
                  ${highlight ? 'ring-2 ring-sky-400' : ''}`}
                title={sort !== 'order' ? 'Enable "Manual Order" to drag & drop' : 'Drag to reorder'}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    <div className="text-xs text-slate-500">/{job.slug}</div>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${job.status === 'archived'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'}`}
                  >
                    {job.status}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {job.tags.map(t => (
                    <span key={t} className="text-xs bg-slate-100 px-2 py-1 rounded-lg">{t}</span>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button onClick={() => navigate(`/jobs/${job.id}`)} className="px-3 py-2 text-sm rounded-lg bg-slate-100">Open</button>
                  <button onClick={() => { setEditing(job); setOpen(true) }} className="px-3 py-2 text-sm rounded-lg bg-slate-100">Edit</button>
                  <button onClick={() => toggleArchive(job)} className="px-3 py-2 text-sm rounded-lg bg-slate-100">
                    {job.status === 'archived' ? 'Unarchive' : 'Archive'}
                  </button>
                  <span className="ml-auto text-slate-400 cursor-grab select-none" title="Drag to reorder">⋮⋮</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit Job' : 'Create Job'}
        footer={
          <div className="flex justify-end gap-2">
            <button className="px-3 py-2 rounded-lg" onClick={() => setOpen(false)}>Cancel</button>
            <button form="job-form" className="px-3 py-2 rounded-lg bg-slate-900 text-white">
              {editing ? 'Save' : 'Create'}
            </button>
          </div>
        }
      >
        <form id="job-form" onSubmit={saveJob} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Title *</label>
            <input name="title" defaultValue={editing?.title || ''} className="border rounded-lg px-3 py-2 w-full" required />
          </div>
          <div>
            <label className="block text-sm mb-1">Slug (unique)</label>
            <input
              name="slug"
              defaultValue={editing?.slug || ''}
              className="border rounded-lg px-3 py-2 w-full"
              onBlur={async (e) => {
                const val = slugify(e.target.value || document.querySelector('[name=title]').value)
                e.target.value = val
                const res = await fetch('/jobs?check=all').then(r => r.json())
                if (!res.items) return
                if (!uniqueSlug(val, res.items, editing?.id)) {
                  alert('Slug already exists. Try another.')
                  e.target.focus()
                }
              }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Tags</label>
            <TagInput
              value={editing?.tags || []}
              onChange={(arr) => { document.querySelector('[name=tags]').value = arr.join(',') }}
            />
            <input type="hidden" name="tags" defaultValue={(editing?.tags || []).join(',')} />
          </div>
        </form>
      </Modal>

      <Toast msg={toast} kind={toastKind} />
    </div>
  )
}
