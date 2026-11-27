import React, {useEffect, useRef, useState} from 'react'
import {BarChart3, ChevronDown, ChevronUp, Download, Eye, FileSpreadsheet, Globe2, Monitor, Pencil, Play, Trash2, Upload, X} from 'lucide-react'
import EmbedFrame from '../components/EmbedFrame.jsx'
import ReportEditor from '../components/ReportEditor.jsx'
import {readConfig, saveConfig, serialize} from '../services/storage.js'
import {emptyReport, labels, normalizeReport, parseConfig} from '../utils/reports.js'

const icons = {powerbi: BarChart3, excel: FileSpreadsheet, web: Globe2}
const iconButton = (label, Icon, handler, disabled = false) =>
  <button type="button" className="icon" title={label} aria-label={label} onClick={handler} disabled={disabled}><Icon size={17}/></button>

export default function Admin() {
  const [initial] = useState(readConfig)
  const [reports, setReports] = useState(initial.reports)
  const [draft, setDraft] = useState(emptyReport)
  const [editing, setEditing] = useState(null)
  const [preview, setPreview] = useState(null)
  const [message, setMessage] = useState(initial.error)
  const [error, setError] = useState(Boolean(initial.error))
  const [pasteOpen, setPasteOpen] = useState(false)
  const [json, setJson] = useState('')
  const input = useRef(null)
  const count = reports.filter(report => report.active).length

  useEffect(() => {
    if (preview) document.getElementById('preview').scrollIntoView()
  }, [preview])

  function notify(value, failed = false) {
    setMessage(value)
    setError(failed)
  }
  function commit(value, notice = 'Configuración guardada en este navegador.') {
    try {
      saveConfig(value)
      setReports(value)
      notify(notice)
      return true
    } catch {
      notify('No se pudo guardar. Comprueba que el navegador permita almacenamiento local.', true)
      return false
    }
  }
  function cancel() {
    setEditing(null)
    setDraft(emptyReport)
  }
  function save(event) {
    event.preventDefault()
    try {
      const report = normalizeReport(draft)
      const next = editing
        ? reports.map(item => item.id === editing ? {...report, id: editing} : item)
        : reports.concat({...report, id: Date.now().toString(36) + Math.random().toString(36).slice(2)})
      if (commit(next)) cancel()
    } catch (exception) { notify(exception.message, true) }
  }
  function move(index, direction) {
    const next = reports.slice()
    const target = index + direction
    ;[next[index], next[target]] = [next[target], next[index]]
    commit(next)
  }
  function importJson(value) {
    try {
      const imported = parseConfig(value)
      if (reports.length && !window.confirm('¿Reemplazar la configuración actual por el JSON importado?')) return
      if (commit(imported, 'Configuración importada y guardada.')) {
        cancel()
        setPasteOpen(false)
        setJson('')
      }
    } catch (exception) { notify('Importación inválida. ' + exception.message, true) }
  }
  function importFile(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => importJson(reader.result)
    reader.onerror = () => notify('No se pudo leer el archivo.', true)
    reader.readAsText(file)
  }
  function exportFile() {
    const url = URL.createObjectURL(new Blob([serialize(reports)], {type: 'application/json'}))
    const link = document.createElement('a')
    link.href = url
    link.download = 'happy-pay-display.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <div className="admin">
    <header className="top"><div className="top-inner">
      <div className="brand"><span className="brand-icon"><Monitor size={23}/></span><div>Happy Pay <strong>Display</strong><small>Señalización digital</small></div></div>
      <a className="button primary" href="/display"><Play size={17}/> Modo televisión</a>
    </div></header>
    <main className="shell">
      <div className="intro"><div><h1>Panel de control</h1><p className="muted">Organiza lo que se reproduce en tus pantallas.</p></div>
        <div className="actions"><button onClick={exportFile}><Download size={17}/> Exportar JSON</button><button onClick={() => setPasteOpen(!pasteOpen)} aria-expanded={pasteOpen}><Upload size={17}/> Importar JSON</button></div>
      </div>
      {pasteOpen && <section className="card transfer">
        <h2>Importar configuración</h2>
        <label>Contenido JSON<textarea rows="4" value={json} onChange={event => setJson(event.target.value)}/></label>
        <div className="actions"><button onClick={() => input.current.click()}>Elegir archivo</button><button className="primary" disabled={!json.trim()} onClick={() => importJson(json)}>Importar texto</button></div>
        <input ref={input} type="file" accept=".json,application/json" hidden onChange={importFile}/>
      </section>}
      {message && <div className={error ? 'feedback error' : 'feedback'} role={error ? 'alert' : 'status'}>{message}</div>}
      <div className="workspace">
        <section className="card queue">
          <div className="section-heading"><div><h2>Orden de reproducción</h2><p className="muted">{reports.length} informes · {count} activos</p></div><Monitor size={23}/></div>
          {reports.length === 0 && <div className="empty"><div className="empty-icon"><Monitor size={28}/></div><h3>Aún no hay informes</h3><p className="muted">Agrega un informe para empezar a configurar tu pantalla.</p><button onClick={() => setPreview({name: 'Prueba de inserción', url: '/prueba.html'})}><Eye size={17}/> Probar inserción</button></div>}
          {reports.map((report, index) => {
            const Icon = icons[report.type]
            return <article className="report" key={report.id}>
              <span className={'type-icon ' + report.type}><Icon size={21}/></span>
              <div className="report-text"><h3>{report.name}</h3><p className="muted">{labels[report.type]} · {report.seconds} s{report.refresh > 0 ? ' · Recarga ' + report.refresh + ' s' : ''}</p></div>
              <div className="report-actions">
                <button className={report.active ? 'toggle on' : 'toggle'} type="button" role="switch" aria-checked={report.active} aria-label={'Reproducir ' + report.name} onClick={() => commit(reports.map(item => item.id === report.id ? {...item, active: !item.active} : item))}>{report.active ? 'Activo' : 'Inactivo'}</button>
                {iconButton('Subir', ChevronUp, () => move(index, -1), index === 0)}
                {iconButton('Bajar', ChevronDown, () => move(index, 1), index === reports.length - 1)}
                {iconButton('Vista previa', Eye, () => setPreview(report))}
                {iconButton('Editar', Pencil, () => {
                  setEditing(report.id)
                  setDraft(report)
                  document.getElementById('editor').scrollIntoView()
                })}
                {iconButton('Eliminar', Trash2, () => {
                  if (window.confirm('¿Eliminar «' + report.name + '»?') && commit(reports.filter(item => item.id !== report.id)) && editing === report.id) cancel()
                })}
              </div>
            </article>
          })}
        </section>
        <ReportEditor draft={draft} change={setDraft} save={save} editing={editing} cancel={cancel} preview={() => {
          try { setPreview(normalizeReport(draft)) } catch (exception) { notify(exception.message, true) }
        }}/>
      </div>
      {preview && <section className="card preview" id="preview">
        <div className="section-heading"><h2>Vista previa · {preview.name}</h2>{iconButton('Cerrar vista previa', X, () => setPreview(null))}</div>
        <div className="preview-frame"><EmbedFrame key={preview.url} url={preview.url} title={preview.name} interactive/></div>
        <p className="muted">Si el contenido pide iniciar sesión, sigue el flujo del proveedor. Comprueba que el informe se vea completo.</p>
      </section>}
    </main>
  </div>
}
