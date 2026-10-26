import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemePreference = 'system' | 'light' | 'dark'

interface ThemeState {
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      preference: 'system',
      setPreference: preference => set({ preference }),
    }),
    { name: 'souqna-theme' },
  ),
)

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference
  return darkQuery().matches ? 'dark' : 'light'
}

/** Keeps <html data-theme> in sync with the preference and the OS setting. */
export function syncThemeToDocument() {
  const apply = () => {
    document.documentElement.dataset.theme = resolveTheme(useThemeStore.getState().preference)
  }
  apply()
  useThemeStore.subscribe(apply)
  darkQuery().addEventListener('change', apply)
}
