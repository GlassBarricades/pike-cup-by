import { useEffect, useState } from 'react'

export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    const onFocus = () => setNow(new Date())
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [intervalMs])

  return now
}
