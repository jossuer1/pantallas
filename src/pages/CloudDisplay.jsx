import React, {useEffect, useState} from 'react'
import Display from './Display.jsx'
import {rpc} from '../services/cloud.js'
import {parseConfig} from '../utils/reports.js'

const cookieName = 'happy_pay_display_device'
const cookieOptions = '; Path=/display; Secure; SameSite=Strict'

function readCode() {
  const match = document.cookie.match(/(?:^|;\s*)happy_pay_display_device=([0-9a-f]{32})(?:;|$)/)
  return match ? match[1] : ''
}

function storeCode(code) {
  document.cookie = cookieName + '=' + code + cookieOptions + '; Max-Age=' + (code ? 31536000 : 0)
}

export default function CloudDisplay() {
  const [code, setCode] = useState(readCode)
  const [config, setConfig] = useState(null)
  const [message, setMessage] = useState('')
  const [pairing, setPairing] = useState(false)
  useEffect(() => {
    if (!code) return
    let stopped = false
    let timer
    let revision = -1
    async function sync() {
      try {
        const result = await rpc('display', {device_code: code, known_revision: revision})
        if (stopped) return
        if (result.config) {
          setConfig({reports: parseConfig(JSON.stringify(result.config)), error: ''})
          revision = result.revision
        }
        setMessage('')
      } catch (error) {
        if (stopped) return
        if (error.code === '42501') {
          storeCode('')
          setCode('')
          setConfig(null)
          setMessage(error.message)
          return
        }
        setMessage('Sin conexión con Supabase. Reintentando…')
      }
      timer = setTimeout(sync, 15000)
    }
    sync()
    return () => { stopped = true; clearTimeout(timer) }
  }, [code])

  async function pair(event) {
    event.preventDefault()
    const value = event.currentTarget.elements.code.value.trim()
    if (!/^[0-9]{6}$/.test(value)) {
      setMessage('Introduce los seis dígitos del panel.')
      return
    }
    setPairing(true)
    setMessage('')
    try {
      const deviceCode = await rpc('redeem', {pin: value})
      if (!deviceCode) {
        setMessage('Código inválido, vencido o agotado. Revisa los dígitos o genera otro código.')
        return
      }
      storeCode(deviceCode)
      setCode(deviceCode)
    } catch (error) { setMessage(error.message) }
    finally { setPairing(false) }
  }

  if (config) return <Display cloudConfig={config} syncMessage={message}/>
  return <main className="display"><div className="tv-message">
    {code ? <p role="status">{message || 'Cargando lista de reproducción…'}</p> : <form className="card editor" onSubmit={pair}>
      <h2>Vincular esta pantalla</h2>
      <label>Código de seis dígitos<input name="code" required inputMode="numeric" maxLength={6} pattern="[0-9]{6}" autoComplete="off"/></label>
      <button className="primary" disabled={pairing}>{pairing ? 'Vinculando…' : 'Vincular'}</button>
      {message && <p role="alert">{message}</p>}
    </form>}
  </div></main>
}
