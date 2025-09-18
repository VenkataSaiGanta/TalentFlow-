
import { http, HttpResponse } from 'msw'
import { db } from '../db'
import { seedIfEmpty } from './seed'

// latency 200–1200ms + ~8% write failures
const delay = () => new Promise(r => setTimeout(r, 200 + Math.random() * 1000))
const FAIL = () => Math.random() < 0.08

const num = (v, fb = 0) => (Number.isFinite(+v) ? +v : fb)
const parseUrl = (req) => {
  const u = new URL(req.url)
  return { q: Object.fromEntries(u.searchParams.entries()) }
}
const paginate = (items, page = 1, pageSize = 10) => {
  page = +page || 1
  pageSize = +pageSize || 10
  const s = (page - 1) * pageSize
  return { items: items.slice(s, s + pageSize), total: items.length }
}

// ---- Jobs helpers  ----

async function normalizeOrdersTx() {
  await db.transaction('rw', db.jobs, async () => {
    const all = await db.jobs.toArray()
    const list = [...all].sort((a,b)=> num(a.order) - num(b.order))
    for (let i=0;i<list.length;i++) {
      list[i].order = i
      if (typeof list[i].slug !== 'string') list[i].slug = String(list[i].slug || '')
      if (typeof list[i].status !== 'string') list[i].status = 'active'
    }
    await db.jobs.bulkPut(list)
  })
}
async function readJobs() {
  await normalizeOrdersTx()
  const all = await db.jobs.toArray()
  return [...all].sort((a,b)=> num(a.order) - num(b.order))
}

// ---------------- JOBS ----------------
const jobsHandlers = [
  // Debug normalizer 
  http.get('/__debug/normalize-jobs', async () => {
    await normalizeOrdersTx()
    const all = await db.jobs.toArray()
    return HttpResponse.json({ fixed: all.length })
  }),

  // List / query
  http.get('/jobs', async ({ request }) => {
    await delay(); await seedIfEmpty()
    const { q } = parseUrl(request)
    const base = await readJobs()
    if (q.check === 'all') return HttpResponse.json({ items: base, total: base.length })

    let items = [...base]
    if (q.search) {
      const s = q.search.toLowerCase()
      items = items.filter(j => j.title.toLowerCase().includes(s) || j.slug.toLowerCase().includes(s))
    }
    if (q.status) items = items.filter(j => j.status === q.status)
    if (q.tags) {
      const t = q.tags.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      if (t.length) items = items.filter(j => t.every(tt => (j.tags || []).map(x => x.toLowerCase()).includes(tt)))
    }
    if (q.sort === 'title') items.sort((a, b) => a.title.localeCompare(b.title))
    return HttpResponse.json(paginate(items, q.page || 1, q.pageSize || 9))
  }),

  
  http.patch('/jobs/reorder', async ({ request }) => {
    const payload = await request.json().catch(() => ({}))
    const id = Number(payload.id)
    let from = Number(payload.fromOrder)
    let to   = Number(payload.toOrder)
    const beforeId = payload.beforeId ?? null
    const afterId  = payload.afterId  ?? null

    if (!Number.isFinite(id)) return HttpResponse.json({ ok:false, reason:'missing id' })

    await db.transaction('rw', db.jobs, async () => {
      const all = await db.jobs.toArray()
      const list = [...all]
        .map((j, i) => ({
          ...j,
          order: Number.isFinite(+j.order) ? +j.order : i,
          slug: typeof j.slug === 'string' ? j.slug : String(j.slug ?? ''),
          status: typeof j.status === 'string' ? j.status : 'active',
        }))
        .sort((a,b) => a.order - b.order)

      const srcIdx = list.findIndex(j => Number(j.id) === id)
      if (srcIdx < 0) return

      if (!Number.isFinite(from)) from = srcIdx
      if (!Number.isFinite(to)) {
        if (beforeId != null) {
          const i = list.findIndex(j => Number(j.id) === Number(beforeId))
          to = i >= 0 ? i : list.length - 1
        } else if (afterId != null) {
          const i = list.findIndex(j => Number(j.id) === Number(afterId))
          to = i >= 0 ? i + 1 : list.length
        } else {
          to = srcIdx
        }
      }

      let destIdx = to
      if (srcIdx < destIdx) destIdx -= 1
      destIdx = Math.max(0, Math.min(list.length - 1, destIdx))

      const [moved] = list.splice(srcIdx, 1)
      list.splice(destIdx, 0, moved)

      for (let i = 0; i < list.length; i++) {
        await db.jobs.put({ ...list[i], order: i })
      }
    })

    return HttpResponse.json({ ok: true })
  }),

  // Create
  http.post('/jobs', async ({ request }) => {
    await delay()
    const body = await request.json()
    const items = await readJobs()
    const row = {
      ...body,
      order: items.length,
      status: typeof body.status === 'string' ? body.status : 'active',
      tags: Array.isArray(body.tags) ? body.tags : []
    }
    if (typeof row.slug !== 'string') row.slug = String(row.slug || '')
    const id = await db.jobs.add(row)
    return HttpResponse.json({ id, ...row })
  }),

  
  http.patch('/jobs/:id(\\d+)', async ({ params, request }) => {
    await delay()
    const id = Number(params.id)
    const patch = (await request.json()) || {}
    if ('slug' in patch && typeof patch.slug !== 'string') patch.slug = String(patch.slug ?? '')
    if ('status' in patch && typeof patch.status !== 'string') patch.status = 'active'
    if ('tags' in patch && !Array.isArray(patch.tags)) patch.tags = []
    if ('order' in patch && !Number.isFinite(+patch.order)) delete patch.order

    const curr = await db.jobs.get(id)
    if (!curr) return HttpResponse.json({ message:'Not found' }, { status:404 })

    await db.jobs.put({ ...curr, ...patch, id })
    return HttpResponse.json(await db.jobs.get(id))
  }),
]

// ---------------- CANDIDATES ----------------
const candidateHandlers = [
  http.get('/candidates', async ({ request }) => {
    await delay(); await seedIfEmpty()
    const { q } = parseUrl(request)
    let items = await db.candidates.toArray()
    if (q.jobId) items = items.filter(c => String(c.jobId) === String(q.jobId))
    if (q.stage) items = items.filter(c => c.stage === q.stage)
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    return HttpResponse.json(paginate(items, q.page || 1, q.pageSize || 2000))
  }),

  http.get('/candidates/:id', async ({ params }) => {
    await delay(); await seedIfEmpty()
    const id = +params.id
    const row = await db.candidates.get(id)
    if (!row) return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    return HttpResponse.json(row)
  }),

  http.patch('/candidates/:id', async ({ params, request }) => {
    await delay()
    if (FAIL()) return HttpResponse.json({ message: 'Simulated write error' }, { status: 500 })
    const id = +params.id
    const patch = await request.json()
    const current = await db.candidates.get(id)
    if (!current) return HttpResponse.json({ message: 'Not found' }, { status: 404 })

    if (patch.stage && patch.stage !== current.stage) {
      const history = Array.isArray(current.history) ? current.history.slice() : []
      history.push({ at: Date.now(), stage: patch.stage })
      await db.candidates.update(id, { stage: patch.stage, history })
    }
    if (patch.addNote && typeof patch.addNote.text === 'string') {
      const notes = Array.isArray(current.notes) ? current.notes.slice() : []
      notes.push(patch.addNote.text)
      await db.candidates.update(id, { notes })
    }
    const rest = { ...patch }
    delete rest.addNote
    if (Object.keys(rest).length) await db.candidates.update(id, rest)

    const row = await db.candidates.get(id)
    return HttpResponse.json(row)
  }),
]

// ---------------- ASSESSMENTS ----------------
const assessmentHandlers = [
  // GET assessment for a job 
  http.get('/assessments/:jobId', async ({ params }) => {
    await delay(); await seedIfEmpty()
    const jobId = Number(params.jobId)

    const all = await db.assessments.toArray() 
    const row = all.find(a => Number(a.jobId) === jobId)

    return HttpResponse.json(row || { sections: [] })
  }),

  // PUT assessment (create/update) 
  http.put('/assessments/:jobId', async ({ params, request }) => {
    await delay()
    if (FAIL()) return HttpResponse.json({ message: 'Simulated write error' }, { status: 500 })

    const jobId = Number(params.jobId)
    const schema = await request.json()

    const all = await db.assessments.toArray() 
    const existing = all.find(a => Number(a.jobId) === jobId)

    if (existing) {
      await db.assessments.update(existing.id, { ...schema, jobId })
    } else {
      await db.assessments.add({ ...schema, jobId })
    }
    return HttpResponse.json({ ok: true })
  }),


  http.post('/assessments/:jobId/submit', async ({ params, request }) => {
    await delay()
    if (FAIL()) return HttpResponse.json({ message: 'Simulated write error' }, { status: 500 })
    const jobId = Number(params.jobId)
    const body = await request.json()
    const submittedAt = Date.now()
    const id = await db.responses.add({ ...body, jobId, submittedAt })
    return HttpResponse.json({ id, submittedAt })
  }),
]
export const handlers = [
  ...jobsHandlers,
  ...candidateHandlers,
  ...assessmentHandlers,
]
