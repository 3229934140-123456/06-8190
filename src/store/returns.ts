import { create } from 'zustand'
import { dataService } from '@/services/dataService'
import type { ReturnRequest, ReturnStatus, CustomerLevel, ReturnType } from '@/types'

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
  approve: (id: string, remark?: string) => Promise<{ success: boolean; logisticsOrder?: any }>
  reject: (id: string, remark: string) => Promise<void>
  updateStatus: (id: string, status: ReturnStatus, remark?: string) => Promise<void>
  inspect: (id: string, result: 'passed' | 'failed', damageLevel: 'none' | 'minor' | 'moderate' | 'severe', damageDescription: string) => Promise<void>
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
    let data = [...dataService.returnRequests]

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
    const detail = dataService.getReturnRequestById(id) || null
    set({ detail, loading: false })
  },

  setFilters: (filters) => {
    set(state => ({ filters: { ...state.filters, ...filters }, pagination: { ...state.pagination, page: 1 } }))
    get().fetchList()
  },

  setPagination: (pagination) => {
    set(state => ({ pagination: { ...state.pagination, ...pagination } }))
    get().fetchList()
  },

  approve: async (id: string, remark?: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const returnRequest = dataService.approveReturn(id, remark)
    
    // 等待自动创建物流单完成
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await get().fetchList()
    const { detail } = get()
    if (detail && detail.id === id) {
      set({ detail: dataService.getReturnRequestById(id) || null })
    }
    
    set({ loading: false })
    return { success: !!returnRequest }
  },

  reject: async (id: string, remark: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    dataService.rejectReturn(id, remark)
    await get().fetchList()
    const { detail } = get()
    if (detail && detail.id === id) {
      set({ detail: dataService.getReturnRequestById(id) || null })
    }
    set({ loading: false })
  },

  updateStatus: async (id: string, status: ReturnStatus, remark?: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    dataService.updateReturnStatus(id, status, remark)
    dataService.addOperationLog(
      '更新状态',
      '退货管理',
      id,
      `状态变更为：${status}${remark ? `，备注：${remark}` : ''}`
    )
    await get().fetchList()
    const { detail } = get()
    if (detail && detail.id === id) {
      set({ detail: dataService.getReturnRequestById(id) || null })
    }
    set({ loading: false })
  },

  inspect: async (
    id: string,
    result: 'passed' | 'failed',
    damageLevel: 'none' | 'minor' | 'moderate' | 'severe',
    damageDescription: string
  ) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    
    dataService.createInspectionRecord(id, result, damageLevel, damageDescription)
    
    // 等待自动业务联动完成
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await get().fetchList()
    const { detail } = get()
    if (detail && detail.id === id) {
      set({ detail: dataService.getReturnRequestById(id) || null })
    }
    
    set({ loading: false })
  },

  clearDetail: () => {
    set({ detail: null })
  },
}))

export default useReturnsStore
