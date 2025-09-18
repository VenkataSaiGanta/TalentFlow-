import { useEffect, useState, useMemo } from 'react'

export function useRouter() {
  const [path, setPath] = useState(window.location.pathname + window.location.search)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname + window.location.search)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  const params = useMemo(() => new URLSearchParams(window.location.search), [path])
  function navigate(to, replace = false) {
    if (replace) window.history.replaceState({}, '', to)
    else window.history.pushState({}, '', to)
    setPath(window.location.pathname + window.location.search)
  }
  function match(pattern) {
    const a = pattern.split('/').filter(Boolean)
    const b = window.location.pathname.split('/').filter(Boolean)
    if (a.length !== b.length) return null
    const out = {}
    for (let i = 0; i < a.length; i++) {
      if (a[i].startsWith(':')) out[a[i].slice(1)] = decodeURIComponent(b[i])
      else if (a[i] !== b[i]) return null
    }
    return out
  }
  return { path, navigate, params, match }
}
