export type ReturnStatus =
  | 'pending_review'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'logistics_created'
  | 'picked_up'
  | 'in_transit'
  | 'warehouse_received'
  | 'inspecting'
  | 'inspection_passed'
  | 'inspection_failed'
  | 'refunding'
  | 'refund_completed'
  | 'ticket_created'
  | 'completed';

export type CustomerLevel = 'normal' | 'silver' | 'gold' | 'platinum';

export type ReturnType = 'exchange' | 'refund' | 'refund_only';

export type LogisticsStatus = 'created' | 'picked' | 'in_transit' | 'delivered' | 'exception';

export type InspectionResult = 'passed' | 'failed';

export type DamageLevel = 'none' | 'minor' | 'moderate' | 'severe';

export type PaymentMethod = 'alipay' | 'wechat' | 'bank' | 'points';

export type RefundMethod = 'original' | 'points' | 'balance' | 'bank_transfer';

export type RefundStatus = 'pending' | 'processing' | 'success' | 'failed';

export type LiabilityParty = 'customer' | 'merchant' | 'logistics' | 'unknown';

export type TicketStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type AlertType = 'inspection_timeout' | 'refund_failed' | 'logistics_exception' | 'ticket_overdue';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AlertStatus = 'unread' | 'read' | 'resolved';

export type UserRole = 'admin' | 'after_sales' | 'warehouse' | 'finance' | 'customer_service';

export interface Address {
  id: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  contactName: string;
  contactPhone: string;
  zipCode?: string;
}

export interface TimelineEvent {
  status: ReturnStatus;
  timestamp: string;
  operator: string;
  remark?: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  orderDate: string;
  productId: string;
  productName: string;
  productCategory: string;
  productPrice: number;
  customerId: string;
  customerName: string;
  customerLevel: CustomerLevel;
  returnReason: string;
  returnType: ReturnType;
  warrantyExpireDate: string;
  inWarranty: boolean;
  depreciationRate: number;
  depreciationAmount: number;
  refundAmount: number;
  status: ReturnStatus;
  createdAt: string;
  updatedAt: string;
  timeline: TimelineEvent[];
}

export interface Courier {
  id: string;
  name: string;
  code: string;
  efficiencyScore: number;
  costScore: number;
  overallScore: number;
  avgDeliveryDays: number;
  avgCost: number;
  coverageAreas: string[];
  maxWeight: number;
  supportsPickup: boolean;
  insuranceRate: number;
}

export interface LogisticsOrder {
  id: string;
  returnId: string;
  orderId: string;
  courierId: string;
  courierName: string;
  trackingNumber: string;
  estimatedCost: number;
  actualCost: number;
  estimatedDays: number;
  actualDays: number;
  status: LogisticsStatus;
  pickupAddress: Address;
  returnAddress: Address;
  createdAt: string;
}

export interface InspectionRecord {
  id: string;
  returnId: string;
  inspector: string;
  inspectionResult: InspectionResult;
  damageLevel: DamageLevel;
  damageDescription: string;
  damageImages: string[];
  receivedQuantity: number;
  inspectedAt: string;
}

export interface RefundRecord {
  id: string;
  returnId: string;
  orderId: string;
  originalPaymentMethod: PaymentMethod;
  refundMethod: RefundMethod;
  refundAmount: number;
  pointsAmount: number;
  status: RefundStatus;
  transactionId: string;
  processedAt: string;
}

export interface LiabilityTicket {
  id: string;
  returnId: string;
  orderId: string;
  assignee: string;
  liabilityParty: LiabilityParty;
  status: TicketStatus;
  priority: Priority;
  description: string;
  resolution: string;
  createdAt: string;
  resolvedAt: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  relatedId: string;
  status: AlertStatus;
  createdAt: string;
}

export interface OperationLog {
  id: string;
  operator: string;
  action: string;
  module: string;
  targetId: string;
  detail: string;
  ip: string;
  createdAt: string;
}

export interface ReasonDistribution {
  reason: string;
  count: number;
}

export interface CategoryReturnRate {
  category: string;
  rate: number;
}

export interface ReportData {
  date: string;
  totalReturns: number;
  returnRate: number;
  approvedRate: number;
  averageProcessingHours: number;
  refundTotalAmount: number;
  logisticsTotalCost: number;
  reasonDistribution: ReasonDistribution[];
  categoryReturnRate: CategoryReturnRate[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  status: 'active' | 'inactive';
  lastLoginAt?: string;
  createdAt: string;
}

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
  pending_review: '待审核',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已驳回',
  logistics_created: '物流单已创建',
  picked_up: '已取件',
  in_transit: '运输中',
  warehouse_received: '仓库已签收',
  inspecting: '验收中',
  inspection_passed: '验收通过',
  inspection_failed: '验收不通过',
  refunding: '退款中',
  refund_completed: '退款完成',
  ticket_created: '已生成工单',
  completed: '已完成',
};

export const RETURN_STATUS_COLOR: Record<ReturnStatus, string> = {
  pending_review: '#f59e0b',
  reviewing: '#3b82f6',
  approved: '#10b981',
  rejected: '#ef4444',
  logistics_created: '#6366f1',
  picked_up: '#8b5cf6',
  in_transit: '#06b6d4',
  warehouse_received: '#14b8a6',
  inspecting: '#f97316',
  inspection_passed: '#22c55e',
  inspection_failed: '#dc2626',
  refunding: '#0ea5e9',
  refund_completed: '#16a34a',
  ticket_created: '#eab308',
  completed: '#64748b',
};

export const LOGISTICS_STATUS_LABEL: Record<LogisticsStatus, string> = {
  created: '已创建',
  picked: '已取件',
  in_transit: '运输中',
  delivered: '已送达',
  exception: '异常',
};

export const LOGISTICS_STATUS_COLOR: Record<LogisticsStatus, string> = {
  created: '#6366f1',
  picked: '#8b5cf6',
  in_transit: '#06b6d4',
  delivered: '#22c55e',
  exception: '#ef4444',
};

export const INSPECTION_RESULT_LABEL: Record<InspectionResult, string> = {
  passed: '通过',
  failed: '不通过',
};

export const DAMAGE_LEVEL_LABEL: Record<DamageLevel, string> = {
  none: '无损坏',
  minor: '轻微损坏',
  moderate: '中度损坏',
  severe: '严重损坏',
};

export const REFUND_STATUS_LABEL: Record<RefundStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  success: '成功',
  failed: '失败',
};

export const REFUND_STATUS_COLOR: Record<RefundStatus, string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  success: '#22c55e',
  failed: '#ef4444',
};

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
  bank: '银行卡',
  points: '积分',
};

export const REFUND_METHOD_LABEL: Record<RefundMethod, string> = {
  original: '原路退回',
  points: '积分补偿',
  balance: '余额退款',
  bank_transfer: '银行转账',
};

export const LIABILITY_PARTY_LABEL: Record<LiabilityParty, string> = {
  customer: '客户责任',
  merchant: '商家责任',
  logistics: '物流责任',
  unknown: '待判定',
};

export const TICKET_STATUS_LABEL: Record<TicketStatus, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急',
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  low: '#64748b',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
};

export const ALERT_TYPE_LABEL: Record<AlertType, string> = {
  inspection_timeout: '验收超时',
  refund_failed: '退款失败',
  logistics_exception: '物流异常',
  ticket_overdue: '工单逾期',
};

export const ALERT_SEVERITY_LABEL: Record<AlertSeverity, string> = {
  info: '提示',
  warning: '警告',
  error: '错误',
  critical: '严重',
};

export const ALERT_SEVERITY_COLOR: Record<AlertSeverity, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  critical: '#dc2626',
};

export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  unread: '未读',
  read: '已读',
  resolved: '已解决',
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  admin: '系统管理员',
  after_sales: '售后管理员',
  warehouse: '仓库管理员',
  finance: '财务人员',
  customer_service: '客服人员',
};

export const CUSTOMER_LEVEL_LABEL: Record<CustomerLevel, string> = {
  normal: '普通会员',
  silver: '白银会员',
  gold: '黄金会员',
  platinum: '铂金会员',
};

export const RETURN_TYPE_LABEL: Record<ReturnType, string> = {
  exchange: '换货',
  refund: '退货退款',
  refund_only: '仅退款',
};
