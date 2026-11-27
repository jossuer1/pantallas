import {parseConfig} from '../utils/reports.js'
export const configKey = 'happy-pay-display.config'
const resumeKey = 'happy-pay-display.current'
export const serialize = reports => JSON.stringify({version: 1, reports}, null, 2)
export function readConfig() {
  try {
    const data = localStorage.getItem(configKey)
    return {reports: data ? parseConfig(data) : [], error: ''}
  } catch {
    return {reports: [], error: 'No se pudo leer la configuración local.'}
  }
}
export function saveConfig(reports) { localStorage.setItem(configKey, serialize(reports)) }
export function readPosition() {
  try { return localStorage.getItem(resumeKey) } catch { return null }
}
export function savePosition(id) {
  try { localStorage.setItem(resumeKey, id) } catch { /* Playback remains available. */ }
}
