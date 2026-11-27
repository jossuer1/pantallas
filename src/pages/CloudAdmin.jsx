import React, {useRef, useState} from 'react'
import Admin from './Admin.jsx'
import {renew, rpc, signIn} from '../services/cloud.js'
import {parseConfig} from '../utils/reports.js'
import {serialize} from '../services/storage.js'

export default function CloudAdmin() {
  const session = useRef(null)
  const revision = useRef(0)
  const [reports, setReports] = useState(null)
  const [message, setMessage] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [code, setCode] = useState('')

  async function token() {
    if (session.current.expires_at * 1000 < Date.now() + 60000) {
      session.current = await renew(session.current.refresh_token)
    }
    return session.current.access_token
  }
  async function login(event) {
    event.preventDefault()
    const {email, password} = event.currentTarget.elements
    setConnecting(true)
    setMessage('')
    try {
      session.current = await signIn(email.value, password.value)
      const result = await rpc('admin', {}, await token())
      revision.current = result.revision
      setReports(parseConfig(JSON.stringify(result.config)))
    } catch (error) { setMessage(error.message) }
    finally { password.value = ''; setConnecting(false) }
  }
  async function save(value) {
    revision.current = await rpc('save', {data: JSON.parse(serialize(value)), expected_revision: revision.current}, await token())
  }
  async function pair() {
    setConnecting(true)
    setCode('')
    setMessage('')
    try {
      const pin = await rpc('pair', {}, await token())
      if (!/^[0-9]{6}$/.test(pin)) throw new Error('Aplica pairing-six-digits.sql en Supabase para activar los códigos de seis dígitos.')
      setCode(pin)
    }
    catch (error) { setMessage(error.message) }
    finally { setConnecting(false) }
  }
  return reports ? <Admin cloud={{reports, save}} extra={<section className="card transfer">
    <h2>Vincular pantalla</h2>
    <p className="muted">Abre /display en la LG e introduce el código de seis dígitos. Vence en cinco minutos.</p>
    <button disabled={connecting} onClick={pair}>Generar código</button>
    {code && <label>Código de pantalla<input readOnly value={code} onFocus={event => event.target.select()}/></label>}
    {message && <p role="alert">{message}</p>}
  </section>}/> : <main className="shell"><section className="card editor">
    <h1>Happy Pay Display</h1>
    <form onSubmit={login}>
      <label>Correo<input name="email" type="email" required autoComplete="username"/></label>
      <label>Contraseña<input name="password" type="password" required autoComplete="current-password"/></label>
      <button className="primary" disabled={connecting}>Iniciar sesión</button>
      {message && <p role="alert">{message}</p>}
    </form>
  </section></main>
}
