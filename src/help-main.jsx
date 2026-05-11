import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Help from './Help.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Help />
  </StrictMode>,
)
