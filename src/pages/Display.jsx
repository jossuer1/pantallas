import React, {useEffect, useMemo, useState} from 'react'
import EmbedFrame from '../components/EmbedFrame.jsx'
import usePlayback from '../hooks/usePlayback.js'
import {configKey, readConfig} from '../services/storage.js'

function fullscreen() {
  const root = document.documentElement
  const request = root.requestFullscreen || root.webkitRequestFullscreen || root.webkitRequestFullScreen
  if (request && !document.fullscreenElement && !document.webkitFullscreenElement) {
    try {
      const result = request.call(root)
      if (result && result.catch) result.catch(() => {})
    } catch { /* The display already fills the viewport. */ }
  }
}

function ReportFrame({report, active, online, reconnect}) {
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    if (!online || !report.refresh) return
    const timer = setInterval(() => setRevision(value => value + 1), report.refresh * 1000)
    return () => clearInterval(timer)
  }, [online, report.refresh, reconnect])
  return <EmbedFrame key={reconnect + ':' + revision} url={report.url} title={report.name} active={active}/>
}

export default function Display() {
  const [config, setConfig] = useState(readConfig)
  const active = useMemo(() => config.reports.filter(report => report.active), [config])
  const {current, move, online, reconnect} = usePlayback(active)
  const [visited, setVisited] = useState([])
  const currentId = current && current.id

  useEffect(() => {
    if (currentId) setVisited(ids => ids.indexOf(currentId) >= 0 ? ids : ids.concat(currentId))
  }, [currentId])

  useEffect(() => {
    const sync = event => {
      if (event.key === configKey || event.key === null) setConfig(readConfig())
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  useEffect(() => {
    const handleKey = event => {
      const key = event.keyCode
      if (key === 37 || key === 39) {
        event.preventDefault()
        move(key === 37 ? -1 : 1)
      } else if (key === 13) fullscreen()
    }
    window.addEventListener('keydown', handleKey)
    window.addEventListener('click', fullscreen)
    fullscreen()
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('click', fullscreen)
    }
  }, [move])

  return <main className="display">
    {active.filter(report => report.id === currentId || visited.indexOf(report.id) >= 0).map(report =>
      <ReportFrame key={report.id + ':' + report.url} report={report} active={report.id === currentId} online={online} reconnect={reconnect}/>)}
    {!current && <div className="tv-message">{config.error || 'No hay informes activos. Configúralos desde el panel principal.'}</div>}
    {!online && <div className="tv-notice" role="status">Sin conexión. Esperando a que vuelva la red.</div>}
  </main>
}
