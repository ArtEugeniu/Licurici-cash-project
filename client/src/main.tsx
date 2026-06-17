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
          fontFamily: 'Roboto, sans-serif',
          fontSize: '15px',
        },
        success: {
          style: {
            background: '#f0fdf4',
            color: '#166534',
          },
        },
        error: {
          style: {
            background: '#fef2f2',
            color: '#991b1b',
          },
        },
      }}
    />
  </StrictMode>,
)
