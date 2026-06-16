import { create } from 'zustand'
import { dataService } from '@/services/dataService'
import type { LogisticsOrder, Courier, LogisticsStatus } from '@/types'

interface LogisticsState {
  orders: LogisticsOrder[]
  orderDetail: LogisticsOrder | null
  couriers: Courier[]
  filters: {
    status?: LogisticsStatus
    keyword?: string
    courierId?: string
    dateRange?: [string, string]
  }
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  loading: boolean
  fetchOrders: () => Promise<void>
  fetchOrderDetail: (id: string) => Promise<void>
  fetchCouriers: () => Promise<void>
  setFilters: (filters: Partial<LogisticsState['filters']>) => void
  setPagination: (pagination: Partial<LogisticsState['pagination']>) => void
  updateOrderStatus: (id: string, status: LogisticsStatus) => Promise<void>
  createOrder: (returnId: string, courierId: string) => Promise<LogisticsOrder | null>
  subscribeToUpdates: () => () => void
  clearOrderDetail: () => void
}

export const useLogisticsStore = create<LogisticsState>((set, get) => ({
  orders: [],
  orderDetail: null,
  couriers: [],
  filters: {},
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
  loading: false,

  fetchOrders: async () => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))

    const { filters, pagination } = get()
    let data = [...dataService.logisticsOrders]

    if (filters.status) {
      data = data.filter(item => item.status === filters.status)
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      data = data.filter(
        item =>
          item.id.toLowerCase().includes(kw) ||
          item.returnId.toLowerCase().includes(kw) ||
          item.trackingNumber.toLowerCase().includes(kw) ||
          item.courierName.toLowerCase().includes(kw)
      )
    }
    if (filters.courierId) {
      data = data.filter(item => item.courierId === filters.courierId)
    }
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      data = data.filter(
        item => item.createdAt >= filters.dateRange![0] && item.createdAt <= filters.dateRange![1]
      )
    }

    const total = data.length
    const start = (pagination.page - 1) * pagination.pageSize
    const orders = data.slice(start, start + pagination.pageSize)

    set({ orders, pagination: { ...pagination, total }, loading: false })
  },

  fetchOrderDetail: async (id: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 200))
    const orderDetail = dataService.getLogisticsOrderById(id) || null
    set({ orderDetail, loading: false })
  },

  fetchCouriers: async () => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 200))
    set({ couriers: dataService.couriers, loading: false })
  },

  setFilters: (filters) => {
    set(state => ({ filters: { ...state.filters, ...filters }, pagination: { ...state.pagination, page: 1 } }))
  },

  setPagination: (pagination) => {
    set(state => ({ pagination: { ...state.pagination, ...pagination } }))
  },

  updateOrderStatus: async (id: string, status: LogisticsStatus) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    const order = dataService.logisticsOrders.find(o => o.id === id)
    if (order) {
      order.status = status
      dataService.persist()
      dataService.notifyListeners()
    }
    const { orderDetail } = get()
    if (orderDetail && orderDetail.id === id) {
      set({ orderDetail: dataService.getLogisticsOrderById(id) || null })
    }
    await get().fetchOrders()
    set({ loading: false })
  },

  createOrder: async (returnId: string, courierId: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    const newOrder = dataService.createLogisticsOrder(returnId, courierId)
    await get().fetchOrders()
    set({ loading: false })
    return newOrder
  },

  subscribeToUpdates: () => {
    const unsubscribe = dataService.subscribe(() => {
      get().fetchOrders()
      get().fetchCouriers()
    })
    return unsubscribe
  },

  clearOrderDetail: () => {
    set({ orderDetail: null })
  },
}))

export default useLogisticsStore
