import React from 'react'
import {createRoot} from 'react-dom/client'
import Admin from './pages/Admin.jsx'
import Display from './pages/Display.jsx'
import CloudAdmin from './pages/CloudAdmin.jsx'
import CloudDisplay from './pages/CloudDisplay.jsx'
import {cloudEnabled, cloudMisconfigured} from './services/cloud.js'
import './styles.css'

const display = /^\/display\/?$/.test(location.pathname)
const Page = cloudEnabled ? (display ? CloudDisplay : CloudAdmin) : (display ? Display : Admin)
createRoot(document.getElementById('root')).render(cloudMisconfigured
  ? <main className="shell">Completa las dos variables de Supabase en Render.</main>
  : <Page/>)
