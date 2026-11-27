const url = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const cloudEnabled = Boolean(url && key)
export const cloudMisconfigured = Boolean(url || key) && !cloudEnabled

function request(path, data, token) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', url + path)
    xhr.timeout = 12000
    xhr.setRequestHeader('apikey', key)
    xhr.setRequestHeader('Content-Type', 'application/json')
    if (token) xhr.setRequestHeader('Authorization', 'Bearer ' + token)
    const unavailable = () => reject(new Error('No se pudo conectar con Supabase.'))
    xhr.onerror = unavailable
    xhr.ontimeout = unavailable
    xhr.onload = () => {
      let response
      try { response = JSON.parse(xhr.responseText) } catch { unavailable(); return }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(response)
        return
      }
      const error = new Error(response.message || response.error_description || response.msg || 'Supabase rechazó la solicitud.')
      error.code = response.code
      reject(error)
    }
    xhr.send(JSON.stringify(data))
  })
}

export const signIn = (email, password) => request('/auth/v1/token?grant_type=password', {email, password})
export const renew = refresh_token => request('/auth/v1/token?grant_type=refresh_token', {refresh_token})
export const rpc = (name, data, token) => request('/rest/v1/rpc/happy_pay_' + name, data, token)
