import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
// Global design tokens, the reset, and the print stylesheet. Imported once
// here; component stylesheets are imported by the components that own them.
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/*
      Hash routing, so a refresh on `#/templates/abc/edit` works on any static
      host: nothing there rewrites a path back to `index.html`, but everything
      after `#` is the client's business.
    */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
