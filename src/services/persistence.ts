import type {
  ReturnRequest,
  LogisticsOrder,
  InspectionRecord,
  RefundRecord,
  LiabilityTicket,
  Alert,
  OperationLog,
  ReportData,
  Courier,
} from '@/types'

export interface PersistedData {
  returnRequests: ReturnRequest[]
  logisticsOrders: LogisticsOrder[]
  inspectionRecords: InspectionRecord[]
  refundRecords: RefundRecord[]
  liabilityTickets: LiabilityTicket[]
  alerts: Alert[]
  operationLogs: OperationLog[]
  reports: ReportData[]
  couriers: Courier[]
  lastUpdated: string
}

const STORAGE_KEY = 'return_management_system_data'
const VERSION_KEY = 'return_management_system_version'
const CURRENT_VERSION = '1.0.0'

export function saveToStorage(data: Partial<PersistedData>): void {
  try {
    const existing = loadFromStorage()
    const toSave: PersistedData = {
      returnRequests: data.returnRequests ?? existing.returnRequests,
      logisticsOrders: data.logisticsOrders ?? existing.logisticsOrders,
      inspectionRecords: data.inspectionRecords ?? existing.inspectionRecords,
      refundRecords: data.refundRecords ?? existing.refundRecords,
      liabilityTickets: data.liabilityTickets ?? existing.liabilityTickets,
      alerts: data.alerts ?? existing.alerts,
      operationLogs: data.operationLogs ?? existing.operationLogs,
      reports: data.reports ?? existing.reports,
      couriers: data.couriers ?? existing.couriers,
      lastUpdated: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION)
  } catch (e) {
    console.error('Failed to save data to localStorage:', e)
  }
}

export function loadFromStorage(): PersistedData | null {
  try {
    const version = localStorage.getItem(VERSION_KEY)
    if (version !== CURRENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as PersistedData
  } catch (e) {
    console.error('Failed to load data from localStorage:', e)
    return null
  }
}

export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(VERSION_KEY)
}

export function hasPersistedData(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null && 
         localStorage.getItem(VERSION_KEY) === CURRENT_VERSION
}
