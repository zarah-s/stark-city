export function applyInitialTheme() {
  const stored = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = stored ? stored === 'dark' : prefersDark
  document.documentElement.classList.toggle('dark', isDark)
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark')
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
}

