// // src/main.jsx
// import React from 'react'
// import ReactDOM from 'react-dom/client'
// import App from './App'
// import './index.css'

// async function boot() {
//   if (import.meta.env.DEV) {
//     const { worker } = await import('./mocks/browser')
//     await worker.start({
//       onUnhandledRequest: 'bypass',
//       serviceWorker: {
//         url: `/mockServiceWorker.js?ts=${Date.now()}`,
//         options: { scope: '/' }
//       }
//     })
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

async function boot() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({
  onUnhandledRequest: 'bypass',
  serviceWorker: {
    url: `/mockServiceWorker.js?ts=${Date.now()}`, // cache-bust so new handlers load
    options: { scope: '/' }
  }
})

  }
}
boot().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<App />)
})
