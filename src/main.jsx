import React from 'react'
import {createRoot} from 'react-dom/client'
import Admin from './pages/Admin.jsx'
import Display from './pages/Display.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(/^\/display\/?$/.test(location.pathname) ? <Display/> : <Admin/>)
