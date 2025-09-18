import React from 'react'

export default function Navbar({ navigate, path }) {
  const tabs = [
    { to: '/jobs', label: 'Jobs' },
    { to: '/candidates', label: 'Candidates' },
    { to: '/assessments', label: 'Assessments' },
  ]
  return (
    <header className="bg-gradient-to-r from-brand-600 to-brand-500 text-white sticky top-0 z-40 shadow-soft">
      <div className="container-xl py-3 flex items-center justify-between">
        <div onClick={()=>navigate('/jobs')} className="font-bold text-xl cursor-pointer tracking-tight">TalentFlow</div>
        <nav className="flex items-center gap-2">
          {tabs.map(t => {
            const active = path.startsWith(t.to)
            return (
              <button key={t.to}
                onClick={()=>navigate(t.to)}
                className={`px-3 py-2 rounded-xl text-sm font-medium ${active? 'bg-white text-brand-600':'hover:bg-white/10'}`}
              >{t.label}</button>
            )
          })}
          
        </nav>
      </div>
    </header>
  )
}
