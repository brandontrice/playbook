import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initSentry, SentryErrorBoundary } from './lib/sentry'

initSentry()

function ErrorFallback() {
  return (
    <div className="mx-auto max-w-md px-6 py-20 text-center text-text-dim">
      <p className="font-display text-2xl text-text">Turnover.</p>
      <p className="mt-2 text-sm">
        Something broke on our end. Try reloading, if it keeps happening we've already been notified.
      </p>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </SentryErrorBoundary>
  </StrictMode>,
)
