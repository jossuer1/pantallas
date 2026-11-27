import {useCallback, useEffect, useState} from 'react'
import {readPosition, savePosition} from '../services/storage.js'
import {nextIndex} from '../utils/reports.js'

export default function usePlayback(reports) {
  const [position, setPosition] = useState(() => ({id: readPosition(), turn: 0}))
  const [online, setOnline] = useState(() => navigator.onLine !== false)
  const [reconnect, setReconnect] = useState(0)
  const found = reports.findIndex(report => report.id === position.id)
  const index = Math.max(0, found)
  const current = reports[index]
  const move = useCallback((direction = 1) => {
    if (reports.length < 2) return
    setPosition(previous => {
      const from = Math.max(0, reports.findIndex(report => report.id === previous.id))
      return {id: reports[nextIndex(from, reports.length, direction)].id, turn: previous.turn + 1}
    })
  }, [reports])
  useEffect(() => {
    if (current) savePosition(current.id)
    if (!current || !online || reports.length < 2) return
    const timer = setTimeout(move, current.seconds * 1000)
    return () => clearTimeout(timer)
  }, [current, online, reports.length, move, position.turn])
  useEffect(() => {
    const offline = () => setOnline(false)
    const restored = () => {
      setOnline(true)
      setReconnect(value => value + 1)
    }
    window.addEventListener('offline', offline)
    window.addEventListener('online', restored)
    return () => {
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', restored)
    }
  }, [])
  return {current, move, online, reconnect}
}
