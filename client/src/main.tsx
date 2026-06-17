import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          fontFamily: 'var(--font-family-base)',
          fontSize: '15px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
        },
        success: {
          style: {
            background: 'var(--color-success-bg)',
            color: 'var(--color-success)',
          },
        },
        error: {
          style: {
            background: 'var(--color-danger-bg)',
            color: 'var(--color-danger)',
          },
        },
      }}
    />
  </StrictMode>,
)
