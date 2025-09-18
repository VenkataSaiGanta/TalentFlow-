// // src/mocks/seed.js
// import { db, stages } from '../db'

// const uuid = () => (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))
// const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
// const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
// const pick = arr => arr[rand(0, arr.length - 1)]

// const FIRST = ['Aarav','Vivaan','Aditya','Advait','Ishaan','Vihaan','Krishna','Darsh','Ayaan','Reyansh','Arjun','Kabir','Atharv','Rohan','Kunal','Dev','Rudra','Anaya','Diya','Meera','Sarah','Naina','Riya','Aisha','Zara']
// const LAST  = ['Sharma','Verma','Agarwal','Patel','Gupta','Mehta','Reddy','Iyer','Nair','Mukherjee','Chatterjee','Khan','Singh','Kaur','Das','Pillai','Gowda','Yadav','Bhat','Kulkarni']
// const ROLES = ['Frontend Engineer','Backend Engineer','Full-Stack Engineer','Data Analyst','ML Engineer','QA Engineer','SRE','Mobile Engineer','Product Designer','Product Manager']
// const TAGS  = ['react','node','next','tailwind','remote','hybrid','onsite','junior','mid','senior','lead']

// function makeAssessments(jobIds) {
//   const single = (id, label, opts=['Yes','No']) => ({ id, type:'single', label, options:opts })
//   const multi  = (id, label, opts) => ({ id, type:'multi', label, options:opts })
//   const short  = (id, label, maxLength=120, pattern='') => ({ id, type:'short', label, maxLength, pattern })
//   const long   = (id, label, maxLength=600) => ({ id, type:'long', label, maxLength })
//   const num    = (id, label, min=0, max=50) => ({ id, type:'number', label, min, max })
//   const fileQ  = (id, label) => ({ id, type:'file', label })

//   const makeSchema = (title) => {
//     const sec1 = {
//       id: uuid(),
//       title: `${title} — Basics`,
//       questions: [
//         short(uuid(), 'Full name', 120),
//         short(uuid(), 'Email', 120, '^\\S+@\\S+\\.\\S+$'),
//         num(uuid(), 'Years of experience', 0, 40),
//         single(uuid(), 'Open to relocation?', ['Yes','No']),
//         multi(uuid(), 'Tech stack you use', ['React','Node','Python','Go','Java']),
//         long(uuid(), 'Most challenging project (brief)', 600),
//       ],
//     }
//     const qTailwind = single(uuid(), 'Have you used Tailwind CSS?', ['Yes','No'])
//     const qWhyTailwind = short(uuid(), 'If Yes, what do you like about Tailwind?', 200)
//     const sec2 = {
//       id: uuid(),
//       title: `${title} — Skills`,
//       questions: [
//         qTailwind,
//         { ...qWhyTailwind, showIf: { qId: qTailwind.id, equals: 'Yes' } },
//         num(uuid(), 'Rate your JS proficiency (1-10)', 1, 10),
//         fileQ(uuid(), 'Upload a sample resume (stub)'),
//       ],
//     }
//     return { sections: [sec1, sec2] } // 10 questions total
//   }

//   const out = []
//   const count = Math.min(3, jobIds.length || 0)
//   for (let i = 0; i < count; i++) out.push({ jobId: jobIds[i], schema: makeSchema(`Assessment ${i+1}`) })
//   return out
// }

// export async function seedIfEmpty() {
//   const hasJobs = await db.jobs.count()
//   if (hasJobs > 0) return

//   // Jobs (25)
//   const jobs = []
//   for (let i = 0; i < 25; i++) {
//     const title = `${pick(ROLES)} ${i+1}`
//     jobs.push({
//       order: i,
//       title,
//       slug: `${slug(title)}-${i+1}`,
//       status: i % 5 === 0 ? 'archived' : 'active',
//       tags: Array.from(new Set([pick(TAGS), pick(TAGS), pick(TAGS)])).slice(0, rand(1,3)),
//     })
//   }
//   const jobIds = await db.jobs.bulkAdd(jobs, { allKeys: true })

//   // Candidates (1000 unique) with history + notes
//   const emails = new Set()
//   const cands = []
//   for (let i = 0; i < 1000; i++) {
//     const first = pick(FIRST), last = pick(LAST)
//     const name  = `${first} ${last}`
//     let email   = `${first}.${last}${rand(1,9999)}@example.com`.toLowerCase()
//     while (emails.has(email)) email = `${first}.${last}${rand(1,9999)}@example.com`.toLowerCase()
//     emails.add(email)

//     // make a short progression history ending in current stage
//     const pathLen = rand(1, 4)
//     const path = [ 'applied', 'screening', 'interview', pick(['offer','rejected','hired']) ]
//     const stagesPath = path.slice(0, pathLen)
//     const createdAt = Date.now() - rand(0, 1000*60*60*24*120)

//     const history = stagesPath.map((stageId, idx) => ({
//       at: createdAt + idx * rand(1, 1000*60*60*24*7),
//       stage: stageId
//     }))
//     const currentStage = stagesPath[stagesPath.length - 1]

//     const jobIdx = rand(0, jobIds.length - 1)
//     const noteSeed = [
//       `Initial screen scheduled with @${pick(FIRST)} ${pick(LAST)}.`,
//       `Reviewed by @${pick(FIRST)} ${pick(LAST)}; looks promising.`,
//       `Requested code sample from @${pick(FIRST)} ${pick(LAST)}.`,
//     ]
//     cands.push({
//       name,
//       email,
//       jobId: jobIds[jobIdx],
//       stage: currentStage,
//       tags: Array.from(new Set([pick(TAGS), pick(TAGS)])).slice(0, rand(0,2)),
//       createdAt,
//       history,              // [{at, stage}]
//       notes: noteSeed.slice(0, rand(0, noteSeed.length)) // array of strings with @mentions
//     })
//   }
//   await db.candidates.bulkAdd(cands)

//   // Assessments (>=3)
//   const schemas = makeAssessments(jobIds)
//   for (const a of schemas) await db.assessments.add({ jobId: a.jobId, ...a.schema })
// }

// src/mocks/seed.js
import { db } from '../db'

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const firstNames = ['Aarav','Isha','Vivaan','Diya','Kabir','Ananya','Rohan','Meera','Arjun','Sara','Rahul','Priya','Kiran','Sneha','Aditya','Nisha','Vikram','Pooja','Ravi','Riya']
const lastNames  = ['Sharma','Verma','Iyer','Reddy','Gupta','Khan','Patel','Das','Nayar','Mehta','Kulkarni','Bose','Joshi','Chauhan','Pillai','Shetty','Dutta','Rastogi','Thakur','Menon']
const cities     = ['Bengaluru','Hyderabad','Pune','Delhi','Mumbai','Chennai','Kolkata','Noida','Gurugram','Ahmedabad']
const tagsPool   = ['remote','hybrid','onsite','react','node','go','python','java','fulltime','contract']

function uniqueEmail(name, i) {
  const base = name.toLowerCase().replace(/\s+/g,'')
  return `${base}${i}@mail.test`
}

function makeJobs() {
  const jobs = []
  for (let i = 0; i < 25; i++) {
    const title = [
      'Frontend Engineer','Backend Engineer','Fullstack Engineer','Data Engineer','ML Engineer',
      'DevOps Engineer','SDET','Product Designer','Product Manager','QA Engineer'
    ][i % 10] + ` ${i+1}`

    jobs.push({
      id: i + 1,
      title,
      slug: title.toLowerCase().replace(/\s+/g,'-'),
      status: Math.random() < 0.25 ? 'archived' : 'active',
      order: i,
      tags: Array.from({length: 2 + (i % 3)}, () => pick(tagsPool))
                 .filter((v, idx, a) => a.indexOf(v) === idx),
    })
  }
  return jobs
}

function makeCandidates(jobIds) {
  const out = []
  const stages = ['applied','screening','interview','offer','hired','rejected']
  for (let i = 0; i < 1000; i++) {
    const name = `${pick(firstNames)} ${pick(lastNames)}`
    const email = uniqueEmail(name, i)
    out.push({
      id: i + 1,
      name,
      email,
      jobId: pick(jobIds),
      stage: pick(stages),
      location: pick(cities),
      notes: [],
      history: [{ at: Date.now() - Math.floor(Math.random()*20)*86400000, stage: 'applied' }],
      createdAt: Date.now() - Math.floor(Math.random() * 30) * 86400000,
    })
  }
  return out
}

function makeAssessments(jobIds) {
  // create 3 different assessment schemas and assign to 3 jobs
  const baseQs = (prefix) => ([
    { id: 'q1',  type:'single',   label:`${prefix} Single Choice`, required:true, options:['Yes','No'] },
    { id: 'q2',  type:'multi',    label:`${prefix} Multi Choice`,  required:false, options:['A','B','C','D'], max:3 },
    { id: 'q3',  type:'short',    label:`${prefix} Short Text`,     required:true, maxLength:80 },
    { id: 'q4',  type:'long',     label:`${prefix} Long Text`,      required:false, maxLength:300 },
    { id: 'q5',  type:'number',   label:`${prefix} Years of Exp`,   required:true, min:0, max:40 },
    { id: 'q6',  type:'file',     label:`${prefix} Resume (stub)`,  required:false },
    { id: 'q7',  type:'single',   label:`${prefix} Relocation OK?`, required:true, options:['Yes','No'] },
    { id: 'q8',  type:'short',    label:`${prefix} Current CTC`,    required:false, maxLength:20 },
    { id: 'q9',  type:'short',    label:`${prefix} Expected CTC`,   required:false, maxLength:20 },
    { id: 'q10', type:'single',   label:`${prefix} Notice Period`,  required:true, options:['Immediate','< 30 days','30-60 days','> 60 days'] },
    // Conditional example: show Q11 only if Q1 === "Yes"
    { id: 'q11', type:'long',     label:`${prefix} Why Yes? (if Q1=Yes)`, required:false, showIf:{ q:'q1', eq:'Yes' }, maxLength:300 },
  ])

  const assessments = []
  const chosen = jobIds.slice(0, 3)
  chosen.forEach((jobId, idx) => {
    assessments.push({
      jobId,
      sections: [
        { id: 's1', title: 'Basics',   questions: baseQs(`A${idx+1}-1`) },
        { id: 's2', title: 'Advanced', questions: baseQs(`A${idx+1}-2`) },
      ]
    })
  })
  return assessments
}

export async function seedIfEmpty() {
  const has = await db.jobs.count()
  if (has > 0) return

  const jobs = makeJobs()
  await db.jobs.bulkAdd(jobs)

  const jobIds = jobs.map(j => j.id)
  const candidates = makeCandidates(jobIds)
  await db.candidates.bulkAdd(candidates)

  const assessments = makeAssessments(jobIds)
  await db.assessments.bulkAdd(assessments)
}
