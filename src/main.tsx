import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DialogProvider } from './state/DialogProvider'
import { AppStoreProvider } from './state/AppStoreProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DialogProvider>
      <AppStoreProvider>
        <App />
      </AppStoreProvider>
    </DialogProvider>
  </StrictMode>,
)
