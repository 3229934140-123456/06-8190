import { mockData, couriers } from './mock/data'
import { saveToStorage, loadFromStorage, hasPersistedData } from './persistence'
import type {
  ReturnRequest,
  LogisticsOrder,
  InspectionRecord,
  RefundRecord,
  LiabilityTicket,
  Alert,
  OperationLog,
  ReturnStatus,
  LogisticsStatus,
  RefundStatus,
  TicketStatus,
  PaymentMethod,
  RefundMethod,
  InspectionResult,
  DamageLevel,
  Priority,
  LiabilityParty,
  AlertType,
  AlertSeverity,
  AlertStatus,
} from '@/types'

interface DataStore {
  returnRequests: ReturnRequest[]
  logisticsOrders: LogisticsOrder[]
  inspectionRecords: InspectionRecord[]
  refundRecords: RefundRecord[]
  liabilityTickets: LiabilityTicket[]
  alerts: Alert[]
  operationLogs: OperationLog[]
  reports: typeof mockData.reports
  couriers: typeof couriers
}

let store: DataStore = {
  returnRequests: [],
  logisticsOrders: [],
  inspectionRecords: [],
  refundRecords: [],
  liabilityTickets: [],
  alerts: [],
  operationLogs: [],
  reports: mockData.reports,
  couriers: couriers,
}

let listeners: Set<() => void> = new Set()

function notifyListeners(): void {
  listeners.forEach(listener => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function initializeData(): void {
  if (hasPersistedData()) {
    const persisted = loadFromStorage()
    if (persisted) {
      store = {
        returnRequests: persisted.returnRequests,
        logisticsOrders: persisted.logisticsOrders,
        inspectionRecords: persisted.inspectionRecords,
        refundRecords: persisted.refundRecords,
        liabilityTickets: persisted.liabilityTickets,
        alerts: persisted.alerts,
        operationLogs: persisted.operationLogs,
        reports: persisted.reports,
        couriers: persisted.couriers,
      }
      return
    }
  }
  store = {
    returnRequests: [...mockData.returnRequests],
    logisticsOrders: [...mockData.logisticsOrders],
    inspectionRecords: [...mockData.inspectionRecords],
    refundRecords: [...mockData.refundRecords],
    liabilityTickets: [...mockData.liabilityTickets],
    alerts: [...mockData.alerts],
    operationLogs: [...mockData.operationLogs],
    reports: [...mockData.reports],
    couriers: [...couriers],
  }
}

function persist(): void {
  saveToStorage({
    returnRequests: store.returnRequests,
    logisticsOrders: store.logisticsOrders,
    inspectionRecords: store.inspectionRecords,
    refundRecords: store.refundRecords,
    liabilityTickets: store.liabilityTickets,
    alerts: store.alerts,
    operationLogs: store.operationLogs,
    reports: store.reports,
    couriers: store.couriers,
  })
}

function generateId(prefix: string): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}${timestamp}${random}`
}

function getCurrentTime(): string {
  return new Date().toISOString().replace('T', ' ').substring(0, 19)
}

function getCurrentUser(): string {
  return '当前用户'
}

function addOperationLog(
  action: string,
  module: string,
  targetId: string,
  detail: string,
  operator?: string
): void {
  const log: OperationLog = {
    id: generateId('LOG'),
    operator: operator || getCurrentUser(),
    action,
    module,
    targetId,
    detail,
    ip: '127.0.0.1',
    createdAt: getCurrentTime(),
  }
  store.operationLogs.unshift(log)
  persist()
  notifyListeners()
}

function addAlert(
  type: AlertType,
  severity: AlertSeverity,
  title: string,
  description: string,
  relatedId: string
): void {
  const alert: Alert = {
    id: generateId('ALT'),
    type,
    severity,
    title,
    description,
    relatedId,
    status: 'unread',
    createdAt: getCurrentTime(),
  }
  store.alerts.unshift(alert)
  persist()
  notifyListeners()
}

function updateReturnStatus(
  id: string,
  status: ReturnStatus,
  remark?: string,
  operator?: string
): ReturnRequest | undefined {
  const item = store.returnRequests.find(r => r.id === id)
  if (item) {
    item.status = status
    item.updatedAt = getCurrentTime()
    item.timeline.push({
      status,
      timestamp: item.updatedAt,
      operator: operator || getCurrentUser(),
      remark,
    })
    persist()
    notifyListeners()
  }
  return item
}

function approveReturn(id: string, remark?: string): ReturnRequest | undefined {
  const result = updateReturnStatus(id, 'approved', remark || '审批通过')
  if (result) {
    addOperationLog('审批通过', '退货管理', id, remark || '审批通过，同意退货申请')
    
    // 自动创建物流单
    setTimeout(() => {
      const returnRequest = store.returnRequests.find(r => r.id === id)
      if (returnRequest && store.couriers.length > 0) {
        // 选择综合评分最高的快递
        const bestCourier = [...store.couriers]
          .filter(c => c.supportsPickup)
          .sort((a, b) => b.overallScore - a.overallScore)[0]
        
        if (bestCourier) {
          createLogisticsOrder(id, bestCourier.id)
        }
      }
    }, 300)
  }
  return result
}

function rejectReturn(id: string, remark: string): ReturnRequest | undefined {
  const result = updateReturnStatus(id, 'rejected', remark)
  if (result) {
    addOperationLog('审批驳回', '退货管理', id, `驳回原因：${remark}`)
  }
  return result
}

function createLogisticsOrder(
  returnId: string,
  courierId: string
): LogisticsOrder | null {
  const returnRequest = store.returnRequests.find(r => r.id === returnId)
  const courier = store.couriers.find(c => c.id === courierId)
  if (!returnRequest || !courier) return null

  const now = getCurrentTime()
  const newOrder: LogisticsOrder = {
    id: generateId('LO'),
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
      id: generateId('ADDR'),
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detail: '示例地址',
      contactPhone: '13800138000',
      contactName: returnRequest.customerName,
    },
    returnAddress: {
      id: generateId('ADDR'),
      province: '上海市',
      city: '上海市',
      district: '浦东新区',
      detail: '张江高科技园区博云路2号',
      contactPhone: '021-88889999',
      contactName: '仓库收',
    },
    createdAt: now,
  }

  store.logisticsOrders.unshift(newOrder)
  updateReturnStatus(returnId, 'logistics_created', `已创建物流单 ${newOrder.id}，快递：${courier.name}`)
  addOperationLog('创建物流单', '物流管理', newOrder.id, 
    `为退货单 ${returnId} 创建物流单，快递：${courier.name}，运单号：${newOrder.trackingNumber}`)
  persist()
  notifyListeners()
  return newOrder
}

function createInspectionRecord(
  returnId: string,
  result: InspectionResult,
  damageLevel: DamageLevel,
  damageDescription: string,
  inspector?: string
): InspectionRecord | null {
  const returnRequest = store.returnRequests.find(r => r.id === returnId)
  if (!returnRequest) return null

  const now = getCurrentTime()
  const record: InspectionRecord = {
    id: generateId('IR'),
    returnId,
    inspector: inspector || getCurrentUser(),
    inspectionResult: result,
    damageLevel,
    damageDescription,
    damageImages: result === 'failed' ? ['/images/damage/sample.jpg'] : [],
    receivedQuantity: 1,
    inspectedAt: now,
  }

  store.inspectionRecords.unshift(record)
  const status = result === 'passed' ? 'inspection_passed' : 'inspection_failed'
  const remark = result === 'passed' 
    ? '验收通过，商品完好' 
    : `验收不通过，${damageLevel === 'minor' ? '轻微' : damageLevel === 'moderate' ? '中度' : '严重'}损坏：${damageDescription}`
  updateReturnStatus(returnId, status, remark, inspector)
  addOperationLog(
    result === 'passed' ? '验收通过' : '验收不通过',
    '仓库管理',
    record.id,
    `退货单 ${returnId} 验收${result === 'passed' ? '通过' : '不通过'}，${remark}`
  )

  if (result === 'passed') {
    // 验收通过，自动创建退款记录
    setTimeout(() => {
      const originalPaymentMethod: 'alipay' | 'wechat' | 'bank' | 'points' = returnRequest.customerLevel === 'platinum' ? 'alipay' : 'wechat'
      const refundMethod: 'original' | 'points' | 'balance' | 'bank_transfer' = returnRequest.customerLevel === 'normal' ? 'points' : 'original'
      createRefundRecord(returnId, originalPaymentMethod, refundMethod, returnRequest.refundAmount)
    }, 500)
  } else {
    // 验收不通过，自动生成责任工单
    addAlert('inspection_timeout', 'warning', 
      '商品验收不通过', `退货单 ${returnId} 验收发现${damageLevel === 'minor' ? '轻微' : damageLevel === 'moderate' ? '中度' : '严重'}损坏`,
      returnId)
    
    setTimeout(() => {
      const priority: 'low' | 'medium' | 'high' | 'urgent' = damageLevel === 'severe' ? 'urgent' : damageLevel === 'moderate' ? 'high' : 'medium'
      createLiabilityTicket(
        returnId,
        `商品验收发现${damageLevel === 'minor' ? '轻微' : damageLevel === 'moderate' ? '中度' : '严重'}损坏：${damageDescription}`,
        priority
      )
    }, 500)
  }

  persist()
  notifyListeners()
  return record
}

function createRefundRecord(
  returnId: string,
  originalPaymentMethod: PaymentMethod,
  refundMethod: RefundMethod,
  refundAmount: number
): RefundRecord | null {
  const returnRequest = store.returnRequests.find(r => r.id === returnId)
  if (!returnRequest) return null

  const now = getCurrentTime()
  const record: RefundRecord = {
    id: generateId('RR'),
    returnId,
    orderId: returnRequest.orderId,
    originalPaymentMethod,
    refundMethod,
    refundAmount,
    pointsAmount: refundMethod === 'points' ? Math.floor(refundAmount * 100) : 0,
    status: 'processing',
    transactionId: generateId('TXN'),
    processedAt: now,
  }

  store.refundRecords.unshift(record)
  updateReturnStatus(returnId, 'refunding', '退款处理中')
  addOperationLog('发起退款', '退款管理', record.id,
    `为退货单 ${returnId} 发起退款，金额：¥${refundAmount}，方式：${refundMethod === 'original' ? '原路退回' : '积分补偿'}`)

  setTimeout(() => {
    record.status = 'success'
    record.processedAt = getCurrentTime()
    updateReturnStatus(returnId, 'refund_completed', `退款完成，金额：¥${refundAmount}`)
    addOperationLog('退款完成', '退款管理', record.id,
      `退货单 ${returnId} 退款完成，金额：¥${refundAmount}`)
    persist()
    notifyListeners()
  }, 1500)

  persist()
  notifyListeners()
  return record
}

function createLiabilityTicket(
  returnId: string,
  description: string,
  priority: Priority = 'high',
  assignee?: string
): LiabilityTicket | null {
  const returnRequest = store.returnRequests.find(r => r.id === returnId)
  if (!returnRequest) return null

  const now = getCurrentTime()
  const ticket: LiabilityTicket = {
    id: generateId('TK'),
    returnId,
    orderId: returnRequest.orderId,
    assignee: assignee || '赵客服',
    liabilityParty: 'unknown',
    status: 'pending',
    priority,
    description,
    resolution: '',
    createdAt: now,
    resolvedAt: '',
  }

  store.liabilityTickets.unshift(ticket)
  updateReturnStatus(returnId, 'ticket_created', `已生成责任判定工单 ${ticket.id}`)
  addOperationLog('生成工单', '工单管理', ticket.id,
    `为退货单 ${returnId} 生成责任判定工单，分配给：${ticket.assignee}`)
  addAlert('ticket_overdue', 'error',
    '待处理责任工单', `退货单 ${returnId} 验收不通过，已生成责任工单 ${ticket.id}`,
    ticket.id)

  persist()
  notifyListeners()
  return ticket
}

function updateTicket(
  ticketId: string,
  updates: Partial<Pick<LiabilityTicket, 'status' | 'liabilityParty' | 'resolution' | 'assignee'>>
): LiabilityTicket | undefined {
  const ticket = store.liabilityTickets.find(t => t.id === ticketId)
  if (!ticket) return undefined

  const oldStatus = ticket.status
  Object.assign(ticket, updates)
  
  if (updates.status === 'resolved' || updates.status === 'closed') {
    ticket.resolvedAt = getCurrentTime()
    const returnReq = store.returnRequests.find(r => r.id === ticket.returnId)
    if (returnReq) {
      updateReturnStatus(ticket.returnId, 'completed', `责任判定完成，工单 ${ticketId} 已${updates.status === 'resolved' ? '解决' : '关闭'}`)
    }
  }

  const statusMap: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    resolved: '已解决',
    closed: '已关闭',
  }
  const partyMap: Record<string, string> = {
    customer: '客户责任',
    merchant: '商家责任',
    logistics: '物流责任',
    unknown: '待判定',
  }

  let detail = ''
  if (updates.status && updates.status !== oldStatus) {
    detail += `状态变更：${statusMap[oldStatus]} → ${statusMap[updates.status]}。`
  }
  if (updates.liabilityParty) {
    detail += `责任判定：${partyMap[updates.liabilityParty]}。`
  }
  if (updates.assignee) {
    detail += `转派给：${updates.assignee}。`
  }
  if (updates.resolution) {
    detail += `处理结果：${updates.resolution}`
  }

  addOperationLog('更新工单', '工单管理', ticketId, detail)
  persist()
  notifyListeners()
  return ticket
}

function markAlertRead(alertId: string): void {
  const alert = store.alerts.find(a => a.id === alertId)
  if (alert) {
    alert.status = 'read'
    persist()
    notifyListeners()
  }
}

function markAllAlertsRead(): void {
  store.alerts.forEach(alert => {
    if (alert.status === 'unread') alert.status = 'read'
  })
  persist()
  notifyListeners()
}

function resolveAlert(alertId: string): void {
  const alert = store.alerts.find(a => a.id === alertId)
  if (alert) {
    alert.status = 'resolved'
    addOperationLog('解决告警', '系统监控', alertId, 
      `告警已解决：${alert.title}`)
    persist()
    notifyListeners()
  }
}

function getReturnRequestById(id: string): ReturnRequest | undefined {
  return store.returnRequests.find(r => r.id === id)
}

function getLogisticsOrderById(id: string): LogisticsOrder | undefined {
  return store.logisticsOrders.find(o => o.id === id)
}

function getLogisticsOrderByReturnId(returnId: string): LogisticsOrder | undefined {
  return store.logisticsOrders.find(o => o.returnId === returnId)
}

function getInspectionRecordByReturnId(returnId: string): InspectionRecord | undefined {
  return store.inspectionRecords.find(r => r.returnId === returnId)
}

function getRefundRecordByReturnId(returnId: string): RefundRecord | undefined {
  return store.refundRecords.find(r => r.returnId === returnId)
}

function getLiabilityTicketByReturnId(returnId: string): LiabilityTicket | undefined {
  return store.liabilityTickets.find(t => t.returnId === returnId)
}

function getUnreadAlertCount(): number {
  return store.alerts.filter(a => a.status === 'unread').length
}

initializeData()

export const dataService = {
  subscribe,
  initializeData,
  
  get returnRequests(): ReturnRequest[] { return store.returnRequests },
  get logisticsOrders(): LogisticsOrder[] { return store.logisticsOrders },
  get inspectionRecords(): InspectionRecord[] { return store.inspectionRecords },
  get refundRecords(): RefundRecord[] { return store.refundRecords },
  get liabilityTickets(): LiabilityTicket[] { return store.liabilityTickets },
  get alerts(): Alert[] { return store.alerts },
  get operationLogs(): OperationLog[] { return store.operationLogs },
  get reports(): typeof mockData.reports { return store.reports },
  get couriers(): typeof couriers { return store.couriers },

  getReturnRequestById,
  getLogisticsOrderById,
  getLogisticsOrderByReturnId,
  getInspectionRecordByReturnId,
  getRefundRecordByReturnId,
  getLiabilityTicketByReturnId,
  getUnreadAlertCount,

  updateReturnStatus,
  approveReturn,
  rejectReturn,
  createLogisticsOrder,
  createInspectionRecord,
  createRefundRecord,
  createLiabilityTicket,
  updateTicket,

  addOperationLog,
  addAlert,
  markAlertRead,
  markAllAlertsRead,
  resolveAlert,

  generateId,
  getCurrentTime,
  persist,
  notifyListeners,
}

export default dataService
