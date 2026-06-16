import { mockData } from './mock/data';
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
  ReturnStatus,
  LogisticsStatus,
  AlertStatus,
  TicketStatus,
  RefundStatus,
} from '@/types';

const DEFAULT_DELAY = 300;

function delay<T>(data: T, ms: number = DEFAULT_DELAY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

function generateId(prefix: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function paginate<T>(list: T[], params: PaginationParams): PaginationResult<T> {
  const { page, pageSize } = params;
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    list: list.slice(start, end),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export interface ReturnQueryParams extends PaginationParams {
  status?: ReturnStatus;
  customerLevel?: ReturnRequest['customerLevel'];
  returnType?: ReturnRequest['returnType'];
  productCategory?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export async function getReturnRequests(
  params: ReturnQueryParams
): Promise<PaginationResult<ReturnRequest>> {
  let list = [...mockData.returnRequests];

  if (params.status) {
    list = list.filter((item) => item.status === params.status);
  }
  if (params.customerLevel) {
    list = list.filter((item) => item.customerLevel === params.customerLevel);
  }
  if (params.returnType) {
    list = list.filter((item) => item.returnType === params.returnType);
  }
  if (params.productCategory) {
    list = list.filter((item) => item.productCategory === params.productCategory);
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(
      (item) =>
        item.id.toLowerCase().includes(kw) ||
        item.orderId.toLowerCase().includes(kw) ||
        item.productName.toLowerCase().includes(kw) ||
        item.customerName.toLowerCase().includes(kw)
    );
  }
  if (params.startDate) {
    list = list.filter((item) => item.createdAt >= params.startDate!);
  }
  if (params.endDate) {
    list = list.filter((item) => item.createdAt <= params.endDate!);
  }

  return delay(paginate(list, params));
}

export async function getReturnRequestById(id: string): Promise<ReturnRequest | null> {
  const item = mockData.returnRequests.find((r) => r.id === id);
  return delay(item ?? null);
}

export async function createReturnRequest(
  data: Omit<ReturnRequest, 'id' | 'createdAt' | 'updatedAt' | 'timeline'>
): Promise<ReturnRequest> {
  const now = new Date().toISOString();
  const newItem: ReturnRequest = {
    ...data,
    id: generateId('RT'),
    createdAt: now,
    updatedAt: now,
    timeline: [
      {
        status: 'pending_review',
        timestamp: now,
        operator: '用户',
        remark: '用户提交退货申请',
      },
    ],
  };
  mockData.returnRequests.unshift(newItem);
  return delay(newItem);
}

export async function updateReturnRequest(
  id: string,
  data: Partial<ReturnRequest>
): Promise<ReturnRequest | null> {
  const index = mockData.returnRequests.findIndex((r) => r.id === id);
  if (index === -1) return delay(null);

  const updated = {
    ...mockData.returnRequests[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  mockData.returnRequests[index] = updated;
  return delay(updated);
}

export async function deleteReturnRequest(id: string): Promise<boolean> {
  const index = mockData.returnRequests.findIndex((r) => r.id === id);
  if (index === -1) return delay(false);
  mockData.returnRequests.splice(index, 1);
  return delay(true);
}

export async function getCouriers(): Promise<Courier[]> {
  return delay([...mockData.couriers]);
}

export interface LogisticsQueryParams extends PaginationParams {
  status?: LogisticsStatus;
  courierId?: string;
  keyword?: string;
}

export async function getLogisticsOrders(
  params: LogisticsQueryParams
): Promise<PaginationResult<LogisticsOrder>> {
  let list = [...mockData.logisticsOrders];

  if (params.status) {
    list = list.filter((item) => item.status === params.status);
  }
  if (params.courierId) {
    list = list.filter((item) => item.courierId === params.courierId);
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(
      (item) =>
        item.id.toLowerCase().includes(kw) ||
        item.returnId.toLowerCase().includes(kw) ||
        item.trackingNumber.toLowerCase().includes(kw)
    );
  }

  return delay(paginate(list, params));
}

export async function getLogisticsOrderById(id: string): Promise<LogisticsOrder | null> {
  const item = mockData.logisticsOrders.find((l) => l.id === id);
  return delay(item ?? null);
}

export async function getLogisticsOrderByReturnId(
  returnId: string
): Promise<LogisticsOrder | null> {
  const item = mockData.logisticsOrders.find((l) => l.returnId === returnId);
  return delay(item ?? null);
}

export async function createLogisticsOrder(
  data: Omit<LogisticsOrder, 'id' | 'createdAt'>
): Promise<LogisticsOrder> {
  const newItem: LogisticsOrder = {
    ...data,
    id: generateId('LO'),
    createdAt: new Date().toISOString(),
  };
  mockData.logisticsOrders.unshift(newItem);
  return delay(newItem);
}

export async function updateLogisticsOrder(
  id: string,
  data: Partial<LogisticsOrder>
): Promise<LogisticsOrder | null> {
  const index = mockData.logisticsOrders.findIndex((l) => l.id === id);
  if (index === -1) return delay(null);

  const updated = { ...mockData.logisticsOrders[index], ...data };
  mockData.logisticsOrders[index] = updated;
  return delay(updated);
}

export async function getInspectionRecordByReturnId(
  returnId: string
): Promise<InspectionRecord | null> {
  const item = mockData.inspectionRecords.find((i) => i.returnId === returnId);
  return delay(item ?? null);
}

export async function createInspectionRecord(
  data: Omit<InspectionRecord, 'id'>
): Promise<InspectionRecord> {
  const newItem: InspectionRecord = {
    ...data,
    id: generateId('IR'),
  };
  mockData.inspectionRecords.push(newItem);
  return delay(newItem);
}

export async function updateInspectionRecord(
  id: string,
  data: Partial<InspectionRecord>
): Promise<InspectionRecord | null> {
  const index = mockData.inspectionRecords.findIndex((i) => i.id === id);
  if (index === -1) return delay(null);

  const updated = { ...mockData.inspectionRecords[index], ...data };
  mockData.inspectionRecords[index] = updated;
  return delay(updated);
}

export interface RefundQueryParams extends PaginationParams {
  status?: RefundStatus;
  refundMethod?: RefundRecord['refundMethod'];
  keyword?: string;
}

export async function getRefundRecords(
  params: RefundQueryParams
): Promise<PaginationResult<RefundRecord>> {
  let list = [...mockData.refundRecords];

  if (params.status) {
    list = list.filter((item) => item.status === params.status);
  }
  if (params.refundMethod) {
    list = list.filter((item) => item.refundMethod === params.refundMethod);
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(
      (item) =>
        item.id.toLowerCase().includes(kw) ||
        item.returnId.toLowerCase().includes(kw) ||
        item.orderId.toLowerCase().includes(kw) ||
        item.transactionId.toLowerCase().includes(kw)
    );
  }

  return delay(paginate(list, params));
}

export async function getRefundRecordByReturnId(
  returnId: string
): Promise<RefundRecord | null> {
  const item = mockData.refundRecords.find((r) => r.returnId === returnId);
  return delay(item ?? null);
}

export async function createRefundRecord(
  data: Omit<RefundRecord, 'id'>
): Promise<RefundRecord> {
  const newItem: RefundRecord = {
    ...data,
    id: generateId('RR'),
  };
  mockData.refundRecords.push(newItem);
  return delay(newItem);
}

export async function updateRefundRecord(
  id: string,
  data: Partial<RefundRecord>
): Promise<RefundRecord | null> {
  const index = mockData.refundRecords.findIndex((r) => r.id === id);
  if (index === -1) return delay(null);

  const updated = { ...mockData.refundRecords[index], ...data };
  mockData.refundRecords[index] = updated;
  return delay(updated);
}

export interface TicketQueryParams extends PaginationParams {
  status?: TicketStatus;
  priority?: LiabilityTicket['priority'];
  liabilityParty?: LiabilityTicket['liabilityParty'];
  assignee?: string;
  keyword?: string;
}

export async function getLiabilityTickets(
  params: TicketQueryParams
): Promise<PaginationResult<LiabilityTicket>> {
  let list = [...mockData.liabilityTickets];

  if (params.status) {
    list = list.filter((item) => item.status === params.status);
  }
  if (params.priority) {
    list = list.filter((item) => item.priority === params.priority);
  }
  if (params.liabilityParty) {
    list = list.filter((item) => item.liabilityParty === params.liabilityParty);
  }
  if (params.assignee) {
    list = list.filter((item) => item.assignee === params.assignee);
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(
      (item) =>
        item.id.toLowerCase().includes(kw) ||
        item.returnId.toLowerCase().includes(kw) ||
        item.description.toLowerCase().includes(kw)
    );
  }

  return delay(paginate(list, params));
}

export async function getLiabilityTicketById(
  id: string
): Promise<LiabilityTicket | null> {
  const item = mockData.liabilityTickets.find((t) => t.id === id);
  return delay(item ?? null);
}

export async function createLiabilityTicket(
  data: Omit<LiabilityTicket, 'id' | 'createdAt'>
): Promise<LiabilityTicket> {
  const newItem: LiabilityTicket = {
    ...data,
    id: generateId('TK'),
    createdAt: new Date().toISOString(),
  };
  mockData.liabilityTickets.unshift(newItem);
  return delay(newItem);
}

export async function updateLiabilityTicket(
  id: string,
  data: Partial<LiabilityTicket>
): Promise<LiabilityTicket | null> {
  const index = mockData.liabilityTickets.findIndex((t) => t.id === id);
  if (index === -1) return delay(null);

  const updated = { ...mockData.liabilityTickets[index], ...data };
  mockData.liabilityTickets[index] = updated;
  return delay(updated);
}

export async function deleteLiabilityTicket(id: string): Promise<boolean> {
  const index = mockData.liabilityTickets.findIndex((t) => t.id === id);
  if (index === -1) return delay(false);
  mockData.liabilityTickets.splice(index, 1);
  return delay(true);
}

export interface AlertQueryParams extends PaginationParams {
  status?: AlertStatus;
  severity?: Alert['severity'];
  type?: Alert['type'];
}

export async function getAlerts(
  params: AlertQueryParams
): Promise<PaginationResult<Alert>> {
  let list = [...mockData.alerts];

  if (params.status) {
    list = list.filter((item) => item.status === params.status);
  }
  if (params.severity) {
    list = list.filter((item) => item.severity === params.severity);
  }
  if (params.type) {
    list = list.filter((item) => item.type === params.type);
  }

  return delay(paginate(list, params));
}

export async function getUnreadAlertCount(): Promise<number> {
  const count = mockData.alerts.filter((a) => a.status === 'unread').length;
  return delay(count);
}

export async function markAlertAsRead(id: string): Promise<Alert | null> {
  const index = mockData.alerts.findIndex((a) => a.id === id);
  if (index === -1) return delay(null);

  const updated = { ...mockData.alerts[index], status: 'read' as AlertStatus };
  mockData.alerts[index] = updated;
  return delay(updated);
}

export async function markAllAlertsAsRead(): Promise<number> {
  let count = 0;
  mockData.alerts.forEach((alert, index) => {
    if (alert.status === 'unread') {
      mockData.alerts[index] = { ...alert, status: 'read' };
      count++;
    }
  });
  return delay(count);
}

export async function resolveAlert(id: string): Promise<Alert | null> {
  const index = mockData.alerts.findIndex((a) => a.id === id);
  if (index === -1) return delay(null);

  const updated = { ...mockData.alerts[index], status: 'resolved' as AlertStatus };
  mockData.alerts[index] = updated;
  return delay(updated);
}

export interface LogQueryParams extends PaginationParams {
  module?: string;
  operator?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export async function getOperationLogs(
  params: LogQueryParams
): Promise<PaginationResult<OperationLog>> {
  let list = [...mockData.operationLogs];

  if (params.module) {
    list = list.filter((item) => item.module === params.module);
  }
  if (params.operator) {
    list = list.filter((item) => item.operator === params.operator);
  }
  if (params.action) {
    list = list.filter((item) => item.action === params.action);
  }
  if (params.startDate) {
    list = list.filter((item) => item.createdAt >= params.startDate!);
  }
  if (params.endDate) {
    list = list.filter((item) => item.createdAt <= params.endDate!);
  }
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    list = list.filter(
      (item) =>
        item.targetId.toLowerCase().includes(kw) ||
        item.detail.toLowerCase().includes(kw) ||
        item.operator.toLowerCase().includes(kw)
    );
  }

  return delay(paginate(list, params));
}

export async function createOperationLog(
  data: Omit<OperationLog, 'id' | 'createdAt'>
): Promise<OperationLog> {
  const newItem: OperationLog = {
    ...data,
    id: generateId('LOG'),
    createdAt: new Date().toISOString(),
  };
  mockData.operationLogs.unshift(newItem);
  return delay(newItem);
}

export interface ReportQueryParams {
  startDate?: string;
  endDate?: string;
}

export async function getReports(params?: ReportQueryParams): Promise<ReportData[]> {
  let list = [...mockData.reports];

  if (params?.startDate) {
    list = list.filter((item) => item.date >= params.startDate!);
  }
  if (params?.endDate) {
    list = list.filter((item) => item.date <= params.endDate!);
  }

  return delay(list);
}

export async function getLatestReport(): Promise<ReportData | null> {
  const list = mockData.reports;
  if (list.length === 0) return delay(null);
  return delay(list[list.length - 1]);
}

export interface StatisticsSummary {
  totalReturns: number;
  pendingCount: number;
  todayReturns: number;
  refundTotalAmount: number;
  logisticsTotalCost: number;
  averageProcessingHours: number;
  returnRate: number;
  approvedRate: number;
  unreadAlertCount: number;
  pendingTicketCount: number;
}

export async function getStatisticsSummary(): Promise<StatisticsSummary> {
  const returns = mockData.returnRequests;
  const latestReport = mockData.reports[mockData.reports.length - 1];
  const today = new Date().toISOString().slice(0, 10);

  const totalReturns = returns.length;
  const pendingCount = returns.filter(
    (r) => r.status === 'pending_review' || r.status === 'reviewing'
  ).length;
  const todayReturns = returns.filter((r) => r.createdAt.slice(0, 10) === today).length;
  const refundTotalAmount = latestReport?.refundTotalAmount ?? 0;
  const logisticsTotalCost = latestReport?.logisticsTotalCost ?? 0;
  const averageProcessingHours = latestReport?.averageProcessingHours ?? 0;
  const returnRate = latestReport?.returnRate ?? 0;
  const approvedRate = latestReport?.approvedRate ?? 0;
  const unreadAlertCount = mockData.alerts.filter((a) => a.status === 'unread').length;
  const pendingTicketCount = mockData.liabilityTickets.filter(
    (t) => t.status === 'pending' || t.status === 'processing'
  ).length;

  return delay({
    totalReturns,
    pendingCount,
    todayReturns,
    refundTotalAmount,
    logisticsTotalCost,
    averageProcessingHours,
    returnRate,
    approvedRate,
    unreadAlertCount,
    pendingTicketCount,
  });
}
