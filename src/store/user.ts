import { create } from 'zustand'
import { mockData } from '@/services/mock/data'
import type { User, UserRole, Alert, AlertStatus, AlertSeverity } from '@/types'

interface UserState {
  currentUser: User | null
  permissions: string[]
  alerts: Alert[]
  unreadCount: number
  loading: boolean
  fetchCurrentUser: () => Promise<void>
  fetchAlerts: () => Promise<void>
  markAlertRead: (id: string) => Promise<void>
  markAllAlertsRead: () => Promise<void>
  resolveAlert: (id: string) => Promise<void>
  setAlertFilter: (status?: AlertStatus, severity?: AlertSeverity) => void
  alertFilters: {
    status?: AlertStatus
    severity?: AlertSeverity
  }
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const MOCK_USER: User = {
  id: 'U001',
  username: 'admin',
  name: '系统管理员',
  email: 'admin@example.com',
  phone: '13800138000',
  role: 'admin',
  avatar: '',
  status: 'active',
  lastLoginAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
  createdAt: '2026-01-01 00:00:00',
}

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'returns:view', 'returns:create', 'returns:edit', 'returns:delete', 'returns:approve',
    'logistics:view', 'logistics:create', 'logistics:edit',
    'warehouse:view', 'warehouse:inspect',
    'finance:view', 'finance:refund',
    'tickets:view', 'tickets:create', 'tickets:edit', 'tickets:assign',
    'reports:view', 'reports:export',
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'system:view', 'system:config',
  ],
  after_sales: [
    'returns:view', 'returns:create', 'returns:edit', 'returns:approve',
    'logistics:view', 'logistics:create',
    'tickets:view', 'tickets:create', 'tickets:edit',
    'reports:view',
  ],
  warehouse: [
    'returns:view',
    'logistics:view', 'logistics:edit',
    'warehouse:view', 'warehouse:inspect',
    'reports:view',
  ],
  finance: [
    'returns:view',
    'finance:view', 'finance:refund',
    'reports:view', 'reports:export',
  ],
  customer_service: [
    'returns:view', 'returns:create',
    'tickets:view', 'tickets:create',
    'reports:view',
  ],
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  permissions: [],
  alerts: [],
  unreadCount: 0,
  loading: false,
  alertFilters: {},

  fetchCurrentUser: async () => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 200))
    const user = MOCK_USER
    const permissions = ROLE_PERMISSIONS[user.role] || []
    set({ currentUser: user, permissions, loading: false })
  },

  fetchAlerts: async () => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    const { alertFilters } = get()
    let data = [...mockData.alerts]
    if (alertFilters.status) {
      data = data.filter(a => a.status === alertFilters.status)
    }
    if (alertFilters.severity) {
      data = data.filter(a => a.severity === alertFilters.severity)
    }
    const unreadCount = mockData.alerts.filter(a => a.status === 'unread').length
    set({ alerts: data, unreadCount, loading: false })
  },

  markAlertRead: async (id: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 200))
    const alert = mockData.alerts.find(a => a.id === id)
    if (alert) {
      alert.status = 'read'
    }
    await get().fetchAlerts()
    set({ loading: false })
  },

  markAllAlertsRead: async () => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    mockData.alerts.forEach(a => {
      if (a.status === 'unread') {
        a.status = 'read'
      }
    })
    await get().fetchAlerts()
    set({ loading: false })
  },

  resolveAlert: async (id: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 200))
    const alert = mockData.alerts.find(a => a.id === id)
    if (alert) {
      alert.status = 'resolved'
    }
    await get().fetchAlerts()
    set({ loading: false })
  },

  setAlertFilter: (status, severity) => {
    set(state => ({ alertFilters: { ...state.alertFilters, status, severity } }))
  },

  logout: () => {
    set({ currentUser: null, permissions: [], alerts: [], unreadCount: 0 })
  },

  hasPermission: (permission: string) => {
    const { permissions } = get()
    return permissions.includes(permission)
  },
}))

export default useUserStore
