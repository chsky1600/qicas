import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import "driver.js/dist/driver.css"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/french/icas">
      <App />
    </BrowserRouter>
  </StrictMode>,
)
