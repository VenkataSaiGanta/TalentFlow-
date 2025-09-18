
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
