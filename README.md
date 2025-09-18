Quick Start:-
Prereqs



npm (or pnpm/yarn, but examples use npm)

1) Install
npm install

2) Run (dev)
npm run dev


.
You should see [MSW] Mocking enabled. in the console on first load.

3) Build & Preview
npm run build
npm run preview

 Project Architecture:-
src/

  api.js                         // safe fetch helper (JSON auto, error handling)
  
  App.jsx                        // router -> pages, navbar, error boundary
  components/
    AssessmentField.jsx          // renders each assessment question type
    AssessmentPreview.jsx        // live runtime (submit/draft/validation)
    ErrorBoundary.jsx
    Modal.jsx, Pagination.jsx, Toast.jsx, TagInput.jsx, Navbar.jsx,VirtualList.jsx
  utils/
    formRuntime.js               // isVisible(), validateAssessment() rules
    validation.js                // slugify(), uniqueSlug()
  views/
    Jobs.jsx                     // jobs grid + DnD reorder + archive
    JobDetail.jsx                // job detail + assessment builder entry
    Candidates.jsx               // virtualized list & Kanban
    CandidateProfile.jsx         // timeline + notes w/ @mentions (render)
    Assessments.jsx              // builder UI + preview
  router.js                      // tiny client-side router
  db.js                          // Dexie schema (v3) & shared 'stages' list
  mocks/
    browser.js                   // MSW worker setup
    handlers.js                  // all HTTP routes (jobs/candidates/assessments)
    seed.js                      // seed 25 jobs, 1000 unique candidates, 3x assessments
  index.css                      // Tailwind entry & design tokens
  main.jsx                       // app bootstrap + MSW start (cache-busted SW)

Data Model :-

Job: { id, title, slug, tags[], status: 'active'|'archived', order: number }

Candidate: { id, name, email, jobId, stage, timeline[], notes[] }

Assessment: { id, jobId, sections: [{ id, title, questions: [...] }] }

Response: { id, jobId, candidateId, answers, submittedAt }

Setup Details:-
Tailwind

Tailwind’s PostCSS plugin moved to a new package. Make sure you have:

postcss.config.cjs

module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, 
    autoprefixer: {},
  },
}


tailwind.config.js generated and content paths set to ./index.html, ./src/**/*.{js,jsx}.


MSW (Service Worker) cache-busting:-

main.jsx starts MSW with a cache-busted URL so handler changes always reload:

await worker.start({
  onUnhandledRequest: 'bypass',
  serviceWorker: {
    url: `/mockServiceWorker.js?ts=${Date.now()}`,
    options: { scope: '/' }
  }
})


To clear Vite cache on Windows PowerShell:-

Remove-Item -Recurse -Force node_modules\.vite

Challenges/Issues Faced:-

1) White screen after clearing IndexedDB

Symptom: Blank page after deleting the talentflow DB.
Cause: Seeding hasn’t run or the MSW worker didn’t load.
Fix:

Ensure seeding is triggered (we call api('/jobs?check=all') in App.jsx mount).

Make sure MSW starts and is fresh:

Cache-bust worker in src/main.jsx:

await worker.start({
  onUnhandledRequest: 'bypass',
  serviceWorker: { url: `/mockServiceWorker.js?ts=${Date.now()}`, options: { scope: '/' } }
})


Restart dev server.

Hard reload & re-install SW.

Verify: In the browser console you see “[MSW] Mocking enabled.” and /jobs returns data.

2) Tailwind error: “trying to use tailwindcss directly as a PostCSS plugin”

Symptom: Vite prints PostCSS/Tailwind error on startup.
Cause: Tailwind’s PostCSS plugin moved.
Fix: use @tailwindcss/postcss:

// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}


Verify: Dev server compiles; styles apply.

3) PATCH /jobs/reorder returns 400 Bad Request

Symptom: MSW log shows PATCH /jobs/reorder (400) and Handler line says it matched PATCH /jobs/:id.
Cause: Route order/shape; :id captured the word “reorder”.
Fix:

Register /jobs/reorder before /jobs/:id and constrain :id to numbers:

http.patch('/jobs/reorder', ...)

http.patch('/jobs/:id(\\d+)', ...) // numeric only


Verify: MSW log shows handler PATCH /jobs/reorder and returns 200.

4) DnD reorder inserts at wrong slot (“+1” off-by-one)

Symptom: Dropping into slot N ends up at N+1 (or before/after confusion).
Cause: Mixed “before/after” semantics and wrong toOrder adjustments.
Fix (we implemented):

Slot semantics: client sends { fromOrder, toOrder } where toOrder is the drop slot after removing source (we adjust once on the client if srcIdx < targetIdx).

Server moves exactly to that index (no extra +/- 1).

Verify: Drag to first slot → item becomes index 0 and persists after refresh.

5) Dexie: “Failed to execute ‘bound’ on ‘IDBKeyRange’: not a valid key”

Symptom: MSW handler throws a DataError from Dexie internals.
Root cause: Secondary index usage or Table.update(...) triggering key-range operations during schema churn.
Fix (hardening we adopted):

Schema with primary keys only (v3):

db.version(3).stores({
  jobs: '++id', candidates: '++id', assessments: '++id', responses: '++id'
})


Never use Table.update(...) on jobs. Use get → merge → put:

const curr = await db.jobs.get(id)
await db.jobs.put({ ...curr, ...patch, id })


All reads: toArray() + JS sort/filter (no .where()/.orderBy()).

Normalization before writes: reassign order = index.

Verify:

Hit /__debug/schema (we exposed a debug endpoint) → each table’s idx is [].

Reorder & archive no longer throw errors.

Error Injection & Latency:-

In handlers.js:

const delay = (min=200, max=1200) => new Promise(r => setTimeout(r, Math.random()*(max-min)+min))
const FAIL = () => Math.random() < 0.08 // ~8% writes fail


I applied  delay() to all endpoints and FAIL() to write endpoints (POST/PATCH/PUT).

Technical Decisions:-

MSW over Mirage: MSW integrates with the platform’s SW and gives a realistic network boundary; great DevTools story.

Dexie (no secondary indexes): I intentionally keep only primary keys to avoid fragile key-range behaviors across schema upgrades and ensure writes use primary-key put paths.

Index-free queries: All filtering/sorting is done in JS after toArray(). For our data sizes (<= a few thousand), this is simpler and extremely fast.

Slot-based reordering: The UX intent is “drop into this position”, not “before/after target”. i implemented consistent client/server semantics around { fromOrder, toOrder }.

Optimistic UI with rollback: All write paths simulate real-world flakiness (5–10% failure). I designed every action to optimistically update and rollback on error.

Tailwind only: No other styling libs; bespoke tokens + utility classes for a product-grade look.

Credentials :-

This app has no login; everything runs locally.
