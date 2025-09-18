
// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App'
// import './index.css'

// async function boot() {
//   if (import.meta.env.DEV) {
//     const { worker } = await import('./mocks/browser')
//     await worker.start({
//   onUnhandledRequest: 'bypass',
//   serviceWorker: {
//     url: `/mockServiceWorker.js?ts=${Date.now()}`, 
//     options: { scope: '/' }
//   }
// })

//   }
// }
// boot().then(() => {
//   ReactDOM.createRoot(document.getElementById('root')).render(<App />)
// })














// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

async function startMSW() {
  // SWs need https (or localhost) + navigator.serviceWorker support
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  // We want MSW in BOTH dev and prod
  const { worker } = await import('./mocks/browser')

  // Vite base path (e.g. '/' or '/myapp/')
  const base = (import.meta.env.BASE_URL || '/')
  const normBase = base.endsWith('/') ? base : base + '/'

  // Worker must be served from the same origin at the correct base
  const swUrl = `${normBase}mockServiceWorker.js`

  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: swUrl,            // e.g. '/mockServiceWorker.js' or '/myapp/mockServiceWorker.js'
      options: { scope: normBase }, // scope must match your app base
    },
  })
}

async function seedDB() {
  try {
    const { seedIfEmpty } = await import('./mocks/seed')
    await seedIfEmpty()
  } catch (e) {
    // If you don't have a seeder, this won't break the app
    console.warn('[seed] skipped:', e?.message || e)
  }
}

async function boot() {
  try {
    await startMSW()
    await seedDB()
  } catch (e) {
    // Don’t crash the page if MSW fails—just log and continue
    console.warn('[msw] failed to start, continuing without mocks:', e?.message || e)
  }
}

boot().finally(() => {
  const root = document.getElementById('root')
  ReactDOM.createRoot(root).render(<App />)
})
