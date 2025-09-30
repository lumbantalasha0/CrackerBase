import { useCallback, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"
const THEME_KEY = "theme"

export default function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY) as Theme | null
      // default to light so dark mode is opt-in
      return (saved as Theme) ?? "light"
    } catch {
      return "light"
    }
  })

  const applyTheme = useCallback((t: Theme) => {
    const root = document.documentElement
    // Only apply dark mode when the user explicitly chose 'dark'.
    // If the user chose 'system' we do not auto-apply dark here; the UI may
    // opt to respect system preference but this app treats 'system' as 'light'
    // by default unless user explicitly selects dark.
    const isDark = t === "dark"

    if (isDark) root.classList.add("dark")
    else root.classList.remove("dark")
  }, [])

  useEffect(() => {
    applyTheme(theme)
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {}
  }, [theme, applyTheme])

  useEffect(() => {
    if (theme !== "system") return
    const mq = typeof window !== "undefined" ? window.matchMedia("(prefers-color-scheme: dark)") : null
    if (!mq) return
    const handler = () => applyTheme("system")
    if (mq.addEventListener) mq.addEventListener("change", handler)
    else mq.addListener(handler as any)
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler)
      else mq.removeListener(handler as any)
    }
  }, [theme, applyTheme])

  const setTheme = (t: Theme) => setThemeState(t)
  const toggle = () => setThemeState((p) => (p === "dark" ? "light" : "dark"))

  return { theme, setTheme, toggle } as const
}