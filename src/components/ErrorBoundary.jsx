import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, err:null } }
  static getDerivedStateFromError(err){ return { hasError:true, err } }
  componentDidCatch(err, info){ console.error('[ErrorBoundary]', err, info) }
  render(){
    if (!this.state.hasError) return this.props.children
    return (
      <div className="container-md py-10">
        <div className="card p-6">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-slate-600 mb-4">
            Try a hard refresh. You can also reset local data below.
          </p>
          <details className="text-xs text-slate-500 whitespace-pre-wrap">
            {String(this.state.err?.stack || this.state.err || 'Unknown error')}
          </details>
          <div className="mt-4 flex gap-2">
            <button className="btn-secondary" onClick={()=>location.reload()}>Reload</button>
            <button
              className="btn-ghost"
              onClick={async ()=>{
                const dbs = await indexedDB.databases?.() || []
                await Promise.all(dbs.filter(d=>d.name==='talentflow').map(d => new Promise(res=>{
                  const req = indexedDB.deleteDatabase('talentflow')
                  req.onsuccess = req.onerror = req.onblocked = () => res()
                })))
                // clear SW + caches too
                navigator.serviceWorker?.getRegistrations?.().then(rs => rs.forEach(r => r.unregister()))
                caches?.keys?.().then(keys => keys.forEach(k => caches.delete(k)))
                location.reload()
              }}
            >
              Reset local data
            </button>
          </div>
        </div>
      </div>
    )
  }
}
