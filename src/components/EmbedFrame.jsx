import React, {useEffect, useState} from 'react'

export default function EmbedFrame({url, title, active = true, interactive = false, revision = 0}) {
  const [status, setStatus] = useState('loading')
  useEffect(() => {
    if (status !== 'loading') return
    const timer = setTimeout(() => setStatus(current => current === 'loading' ? 'slow' : current), 12000)
    return () => clearTimeout(timer)
  }, [status])
  return <div className={active ? 'embed-frame' : 'embed-frame embed-hidden'} aria-hidden={!active}>
    <iframe src={url} title={title} tabIndex={interactive || active ? 0 : -1}
      allowFullScreen referrerPolicy="strict-origin-when-cross-origin"
      onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} data-revision={revision}/>
    {active && (status === 'slow' || status === 'error') &&
      <div className="tv-notice" role="status">{status === 'slow' ? 'El contenido está tardando en cargar.' : 'No se pudo cargar el contenido.'}</div>}
  </div>
}
