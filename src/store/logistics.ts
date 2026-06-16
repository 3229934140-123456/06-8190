import { create } from 'zustand'
import { mockData } from '@/services/mock/data'
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
    let data = [...mockData.logisticsOrders]

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
    const orderDetail = mockData.logisticsOrders.find(item => item.id === id) || null
    set({ orderDetail, loading: false })
  },

  fetchCouriers: async () => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 200))
    set({ couriers: mockData.couriers, loading: false })
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
    const order = mockData.logisticsOrders.find(o => o.id === id)
    if (order) {
      order.status = status
    }
    const { orderDetail } = get()
    if (orderDetail && orderDetail.id === id) {
      set({ orderDetail: order || null })
    }
    await get().fetchOrders()
    set({ loading: false })
  },

  createOrder: async (returnId: string, courierId: string) => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    const returnRequest = mockData.returnRequests.find(r => r.id === returnId)
    const courier = mockData.couriers.find(c => c.id === courierId)
    if (!returnRequest || !courier) {
      set({ loading: false })
      return null
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    const newOrder: LogisticsOrder = {
      id: `LO${Date.now()}`,
      returnId,
      orderId: returnRequest.orderId,
      courierId,
      courierName: courier.name,
      trackingNumber: `${courier.name.substring(0, 2)}${Math.floor(Math.random() * 10000000000)}`,
      estimatedCost: courier.avgCost,
      actualCost: 0,
      estimatedDays: courier.avgDeliveryDays,
      actualDays: 0,
      status: 'created',
      pickupAddress: {
        id: `ADDR${Date.now()}1`,
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        detail: '示例地址',
        contactPhone: '13800138000',
        contactName: returnRequest.customerName,
      },
      returnAddress: {
        id: `ADDR${Date.now()}2`,
        province: '上海市',
        city: '上海市',
        district: '浦东新区',
        detail: '张江高科技园区博云路2号',
        contactPhone: '021-88889999',
        contactName: '仓库收',
      },
      createdAt: now,
    }
    mockData.logisticsOrders.unshift(newOrder)
    returnRequest.status = 'logistics_created'
    returnRequest.updatedAt = now
    returnRequest.timeline.push({
      status: 'logistics_created',
      timestamp: now,
      operator: '当前用户',
      remark: `已创建物流单 ${newOrder.id}`,
    })
    await get().fetchOrders()
    set({ loading: false })
    return newOrder
  },

  clearOrderDetail: () => {
    set({ orderDetail: null })
  },
}))

export default useLogisticsStore
