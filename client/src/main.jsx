// ─── ENTRY POINT ──────────────────────────────────────────────────────────────
// This is the very first file Vite runs.
// It mounts the entire React app into the <div id="root"> in index.html.

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx' // Root component — all routes and providers live there

ReactDOM.createRoot(
  document.getElementById('root') // Targets <div id="root"> in index.html — don't rename it
).render(
  <React.StrictMode>
    {/* StrictMode runs extra checks in development only — no effect in production.
        Remove <React.StrictMode> if you see double-render side effects during dev. */}
    <App />
  </React.StrictMode>
)