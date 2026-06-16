import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface AppState {
  sidebarCollapsed: boolean
  theme: Theme
  breadcrumbs: { label: string; path?: string }[]
  loading: boolean
  notification: {
    show: boolean
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration: number
  } | null
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  setBreadcrumbs: (breadcrumbs: { label: string; path?: string }[]) => void
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string, duration?: number) => void
  hideNotification: () => void
  setLoading: (loading: boolean) => void
}

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('app-theme') as Theme | null
    if (saved === 'light' || saved === 'dark') return saved
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
  }
  return 'light'
}

const getInitialSidebarState = (): boolean => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved === 'true'
  }
  return false
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: getInitialSidebarState(),
  theme: getInitialTheme(),
  breadcrumbs: [],
  loading: false,
  notification: null,

  toggleSidebar: () => {
    set(state => {
      const collapsed = !state.sidebarCollapsed
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar-collapsed', String(collapsed))
      }
      return { sidebarCollapsed: collapsed }
    })
  },

  setSidebarCollapsed: (collapsed: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', String(collapsed))
    }
    set({ sidebarCollapsed: collapsed })
  },

  toggleTheme: () => {
    set(state => {
      const theme = state.theme === 'light' ? 'dark' : 'light'
      if (typeof window !== 'undefined') {
        localStorage.setItem('app-theme', theme)
        document.documentElement.classList.toggle('dark', theme === 'dark')
      }
      return { theme }
    })
  },

  setTheme: (theme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('app-theme', theme)
      document.documentElement.classList.toggle('dark', theme === 'dark')
    }
    set({ theme })
  },

  setBreadcrumbs: (breadcrumbs) => {
    set({ breadcrumbs })
  },

  showNotification: (type, message, duration = 3000) => {
    set({ notification: { show: true, type, message, duration } })
    if (duration > 0) {
      setTimeout(() => {
        set({ notification: null })
      }, duration)
    }
  },

  hideNotification: () => {
    set({ notification: null })
  },

  setLoading: (loading: boolean) => {
    set({ loading })
  },
}))

export default useAppStore
