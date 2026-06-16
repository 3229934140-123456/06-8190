import { create } from 'zustand'
import { dataService } from '@/services/dataService'
import type { ReportData } from '@/types'

interface ReportsState {
  dailyData: ReportData[]
  summary: {
    totalReturns: number
    totalApproved: number
    totalRejected: number
    totalRefundAmount: number
    totalLogisticsCost: number
    avgProcessingHours: number
    returnRate: number
    approvedRate: number
  } | null
  dateRange: [string, string]
  loading: boolean
  fetchDailyData: () => Promise<void>
  fetchSummary: () => Promise<void>
  setDateRange: (range: [string, string]) => void
  getReasonDistribution: () => { reason: string; count: number }[]
  getCategoryReturnRate: () => { category: string; rate: number }[]
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  dailyData: [],
  summary: null,
  dateRange: ['', ''],
  loading: false,

  fetchDailyData: async () => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    const { dateRange } = get()
    let data = [...dataService.reports]
    if (dateRange[0] && dateRange[1]) {
      data = data.filter(item => item.date >= dateRange[0] && item.date <= dateRange[1])
    }
    set({ dailyData: data, loading: false })
  },

  fetchSummary: async () => {
    set({ loading: true })
    await new Promise(resolve => setTimeout(resolve, 300))
    const { dateRange } = get()
    let data = [...dataService.reports]
    if (dateRange[0] && dateRange[1]) {
      data = data.filter(item => item.date >= dateRange[0] && item.date <= dateRange[1])
    }
    if (data.length === 0) {
      set({ summary: null, loading: false })
      return
    }

    const totalReturns = data.reduce((sum, d) => sum + d.totalReturns, 0)
    const totalRefundAmount = data.reduce((sum, d) => sum + d.refundTotalAmount, 0)
    const totalLogisticsCost = data.reduce((sum, d) => sum + d.logisticsTotalCost, 0)
    const avgProcessingHours = data.reduce((sum, d) => sum + d.averageProcessingHours, 0) / data.length
    const returnRate = data.reduce((sum, d) => sum + d.returnRate, 0) / data.length
    const approvedRate = data.reduce((sum, d) => sum + d.approvedRate, 0) / data.length
    const totalApproved = Math.floor(totalReturns * approvedRate)
    const totalRejected = totalReturns - totalApproved

    set({
      summary: {
        totalReturns,
        totalApproved,
        totalRejected,
        totalRefundAmount: Number(totalRefundAmount.toFixed(2)),
        totalLogisticsCost: Number(totalLogisticsCost.toFixed(2)),
        avgProcessingHours: Number(avgProcessingHours.toFixed(2)),
        returnRate: Number(returnRate.toFixed(4)),
        approvedRate: Number(approvedRate.toFixed(4)),
      },
      loading: false,
    })
  },

  setDateRange: (range: [string, string]) => {
    set({ dateRange: range })
  },

  getReasonDistribution: () => {
    const { dailyData } = get()
    const aggregated: Record<string, number> = {}
    dailyData.forEach(d => {
      d.reasonDistribution.forEach(item => {
        aggregated[item.reason] = (aggregated[item.reason] || 0) + item.count
      })
    })
    return Object.entries(aggregated).map(([reason, count]) => ({ reason, count }))
  },

  getCategoryReturnRate: () => {
    const { dailyData } = get()
    if (dailyData.length === 0) return []
    const aggregated: Record<string, number[]> = {}
    dailyData.forEach(d => {
      d.categoryReturnRate.forEach(item => {
        if (!aggregated[item.category]) aggregated[item.category] = []
        aggregated[item.category].push(item.rate)
      })
    })
    return Object.entries(aggregated).map(([category, rates]) => ({
      category,
      rate: Number((rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(4)),
    }))
  },
}))

export default useReportsStore
