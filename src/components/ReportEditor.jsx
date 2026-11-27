import React from 'react'
import {Eye, Save, X} from 'lucide-react'
import {labels} from '../utils/reports.js'

export default function ReportEditor({draft, change, save, preview, cancel, editing}) {
  const field = key => ({value: draft[key], onChange: event => change({...draft, [key]: event.target.value})})
  return <section className="card editor" id="editor">
    <div className="section-heading"><h2>{editing ? 'Editar informe' : 'Agregar informe'}</h2>{editing && <button type="button" className="icon" title="Cancelar edición" aria-label="Cancelar edición" onClick={cancel}><X size={18}/></button>}</div>
    <form onSubmit={save}>
      <label>Nombre del informe<input required maxLength="100" placeholder="Ej. Ventas mensuales" {...field('name')}/></label>
      <label>Tipo de contenido<select {...field('type')}>{Object.keys(labels).map(key => <option key={key} value={key}>{labels[key]}</option>)}</select></label>
      <label>URL de inserción<input required type="url" placeholder="https://…" {...field('url')}/></label>
      <div className="split">
        <label>Duración (s)<input required type="number" min="1" max="86400" {...field('seconds')}/></label>
        <label>Recarga (s)<input required type="number" min="0" max="86400" {...field('refresh')}/></label>
      </div>
      <p className="muted hint">Usa 0 para desactivar la recarga periódica.</p>
      <label className="check"><input type="checkbox" checked={draft.active} onChange={event => change({...draft, active: event.target.checked})}/> Incluir en la rotación</label>
      <div className="actions"><button type="button" onClick={preview}><Eye size={17}/> Vista previa</button><button className="primary" type="submit"><Save size={17}/> Guardar</button></div>
    </form>
  </section>
}
