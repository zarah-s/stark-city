import { useEffect, useState } from 'react'
import { toggleTheme, applyInitialTheme } from '../theme'

export function DarkModeToggle() {
  const [, setTick] = useState(0)
  useEffect(() => { applyInitialTheme() }, [])
  return (
    <button className="btn btn-outline" onClick={() => { toggleTheme(); setTick(t => t + 1) }} aria-label="Toggle dark mode">
      <span className="i">🌓</span>
      <span>Theme</span>
    </button>
  )
}

export default DarkModeToggle

