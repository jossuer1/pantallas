export const labels = { powerbi: 'Power BI', excel: 'Excel', web: 'Página web' }
export const emptyReport = {name: '', url: '', type: 'powerbi', seconds: 30, refresh: 0, active: true}

const secretKey = /^(r|token|[a-z_]*token|code|password|secret|client_secret|tempauth|sig|signature|authkey|access_key|key)$/i

export function normalizeReport(item) {
  if (!item || !Object.prototype.hasOwnProperty.call(labels, item.type)) throw new Error('Selecciona un tipo de contenido válido.')
  const name = typeof item.name === 'string' ? item.name.trim() : ''
  if (!name || name.length > 100) throw new Error('Escribe un nombre de 1 a 100 caracteres.')
  let url
  try { url = new URL(item.url.trim()) } catch { throw new Error('Introduce una URL de inserción válida.') }
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Usa una URL HTTPS sin credenciales.')
  const params = url.search.substring(1).split('&')
  const hashParams = url.hash.substring(1).split(/[?&]/)
  if (params.concat(hashParams).some(param => secretKey.test(decodeURIComponent(param.split('=')[0])))) {
    throw new Error('El enlace contiene un parámetro de acceso o publicación pública. Usa un enlace seguro.')
  }
  if (url.hostname === 'app.powerbi.com' && /^\/view\/?$/i.test(url.pathname)) throw new Error('Usa la inserción segura de Power BI.')
  if (item.type === 'powerbi' && (!/(^|\.)powerbi\.com$/i.test(url.hostname) || !/^\/(reportEmbed|rdlEmbed)\/?$/i.test(url.pathname))) {
    throw new Error('Copia el enlace de Power BI desde Insertar informe → Sitio web o portal.')
  }
  const seconds = Number(item.seconds)
  const refresh = Number(item.refresh)
  if (item.seconds === '' || !Number.isInteger(seconds) || seconds < 1 || seconds > 86400 ||
      item.refresh === '' || !Number.isInteger(refresh) || refresh < 0 || refresh > 86400) {
    throw new Error('Usa segundos enteros. Duración de 1 a 86400 y recarga de 0 a 86400.')
  }
  if (typeof item.active !== 'boolean') throw new Error('El estado del informe debe ser activo o inactivo.')
  return {name, url: url.href, type: item.type, seconds, refresh, active: item.active}
}

export function parseConfig(json) {
  const data = JSON.parse(json)
  if (!data || data.version !== 1 || !Array.isArray(data.reports)) throw new Error('El JSON debe contener una configuración de Happy Pay Display versión 1.')
  const seen = new Set()
  return data.reports.map(item => {
    const report = normalizeReport(item)
    if (typeof item.id !== 'string' || !item.id || seen.has(item.id)) throw new Error('Cada informe necesita un identificador único.')
    seen.add(item.id)
    return {...report, id: item.id}
  })
}

export function nextIndex(index, length, direction = 1) {
  return (index + direction + length) % length
}
