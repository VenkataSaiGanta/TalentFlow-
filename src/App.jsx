import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import Jobs from './views/Jobs'
import JobDetail from './views/JobDetail'
import Candidates from './views/Candidates'
import CandidateProfile from './views/CandidateProfile'
import Assessments from './views/Assessments'
import { useRouter } from './router'
import ErrorBoundary from './components/ErrorBoundary'
import { api } from './api'

function useEnsureSeed() {
  // Kick a lightweight request so MSW can seed Dexie on first load
  useEffect(() => { api('/jobs?check=all').catch(() => {}) }, [])
}

export default function App() {
  useEnsureSeed()

  const { path, navigate, match } = useRouter()
  const mJob = match('/jobs/:id')
  const mCand = match('/candidates/:id')

  let page = null
  if (path.startsWith('/jobs')) {
    // Keep JobDetail contract unchanged (expects `match`)
    page = mJob ? <JobDetail match={mJob} /> : <Jobs navigate={navigate} />
  } else if (path.startsWith('/candidates')) {
    // CandidateProfile expects `params` and `navigate`
    page = mCand
      ? <CandidateProfile params={mCand.params} navigate={navigate} />
      : <Candidates navigate={navigate} />
  } else if (path.startsWith('/assessments')) {
    page = <Assessments />
  } else {
    page = <Jobs navigate={navigate} />
  }

  return (
    <ErrorBoundary>
      <div>
        <Navbar navigate={navigate} path={path} />
        {page}
        <footer className="container-xl py-10 text-xs text-slate-500">
         @Ganta Venkata Sai
        </footer>
      </div>
    </ErrorBoundary>
  )
}
