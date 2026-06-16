import { create } from 'zustand'
import { mockData } from '@/services/mock/data'
import type { ReturnRequest, ReturnStatus } from '@/types'

interface ReturnsState {
  list: ReturnRequest[]
  detail: ReturnRequest | null
  filters: {
    status?: ReturnStatus
    keyword?: string
    customerLevel?: string
    returnType?: string
    dateRange?: [string, string]
  }
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  loading: boolean
  fetchList: () => Promise<void>
  fetchDetail: (id: string) => Promise<void>
  setFilters: (filters: Partial<ReturnsState['filters']>) => void
  setPagination: (pagination: Partial<ReturnsState['pagination']>) => void
  approve: (id: string, remark?: string) => Promise<void>
  reject: (id: string, remark: string) => Promise<void>
  updateStatus: (id: string, status: ReturnStatus, remark?: string) => Promise<void>
  clearDetail: () => void
}

export const useReturnsStore = create<ReturnsState>((set, get) => ({
  list: [],
  detail: null,
  filters: {},
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  loading: false,

  fetchList: async () => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))

    const { filters, pagination } = get()
    let data = [...mockData.returnRequests]

    if (filters.status) {
      data = data.filter(item => item.status === filters.status)
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      data = data.filter(
        item =>
          item.id.toLowerCase().includes(kw) ||
          item.orderId.toLowerCase().includes(kw) ||
          item.productName.toLowerCase().includes(kw) ||
          item.customerName.toLowerCase().includes(kw)
      )
    }
    if (filters.customerLevel) {
      data = data.filter(item => item.customerLevel === filters.customerLevel)
    }
    if (filters.returnType) {
      data = data.filter(item => item.returnType === filters.returnType)
    }
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      data = data.filter(
        item => item.createdAt >= filters.dateRange![0] && item.createdAt <= filters.dateRange![1]
      )
    }

    const total = data.length
    const start = (pagination.page - 1) * pagination.pageSize
    const list = data.slice(start, start + pagination.pageSize)

    set({ list, pagination: { ...pagination, total }, loading: false })
  },

  fetchDetail: async (id: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 200))
    const detail = mockData.returnRequests.find(item => item.id === id) || null
    set({ detail, loading: false })
  },

  setFilters: (filters) => {
    set(state => ({ filters: { ...state.filters, ...filters }, pagination: { ...state.pagination, page: 1 } }))
  },

  setPagination: (pagination) => {
    set(state => ({ pagination: { ...state.pagination, ...pagination } }))
  },

  approve: async (id: string, remark?: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    const item = mockData.returnRequests.find(r => r.id === id)
    if (item) {
      item.status = 'approved'
      item.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19)
      item.timeline.push({
        status: 'approved',
        timestamp: item.updatedAt,
        operator: '当前用户',
        remark: remark || '审批通过',
      })
    }
    await get().fetchList()
    set({ loading: false })
  },

  reject: async (id: string, remark: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    const item = mockData.returnRequests.find(r => r.id === id)
    if (item) {
      item.status = 'rejected'
      item.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19)
      item.timeline.push({
        status: 'rejected',
        timestamp: item.updatedAt,
        operator: '当前用户',
        remark,
      })
    }
    await get().fetchList()
    set({ loading: false })
  },

  updateStatus: async (id: string, status: ReturnStatus, remark?: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    const item = mockData.returnRequests.find(r => r.id === id)
    if (item) {
      item.status = status
      item.updatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19)
      item.timeline.push({
        status,
        timestamp: item.updatedAt,
        operator: '当前用户',
        remark,
      })
    }
    const { detail } = get()
    if (detail && detail.id === id) {
      set({ detail: item || null })
    }
    await get().fetchList()
    set({ loading: false })
  },

  clearDetail: () => {
    set({ detail: null })
  },
}))

export default useReturnsStore
