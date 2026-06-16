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

export type ProductCategory =
  | '手机数码'
  | '家用电器'
  | '服装鞋帽'
  | '美妆护肤'
  | '食品生鲜'
  | '家居用品'
  | '运动户外'
  | '图书文具';

export type ReturnReason =
  | '商品质量问题'
  | '与描述不符'
  | '发错商品'
  | '商品损坏'
  | '不想要了'
  | '尺寸不合适'
  | '过期变质'
  | '功能异常';

export type LiabilityParty = 'customer' | 'merchant' | 'logistics' | 'unknown';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type ReturnType = 'exchange' | 'refund' | 'refund_only';

export type LogisticsStatus = 'created' | 'picked' | 'in_transit' | 'delivered' | 'exception';

export type InspectionResult = 'passed' | 'failed';

export type DamageLevel = 'none' | 'minor' | 'moderate' | 'severe';

export type RefundMethod = 'original' | 'points';

export type RefundStatus = 'pending' | 'processing' | 'success' | 'failed';

export type PaymentMethod = 'alipay' | 'wechat' | 'bank' | 'points';

export type TicketStatus = 'pending' | 'processing' | 'resolved' | 'closed';

export type AlertType = 'inspection_timeout' | 'refund_failed' | 'logistics_exception' | 'ticket_overdue';

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

export type AlertStatus = 'unread' | 'read' | 'resolved';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
}

export interface OptionConfig<T extends string> {
  value: T;
  label: string;
}

export const RETURN_STATUS_CONFIG: Record<ReturnStatus, StatusConfig> = {
  pending_review: {
    label: '待审核',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  reviewing: {
    label: '审核中',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  approved: {
    label: '已通过',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.15)',
  },
  rejected: {
    label: '已驳回',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  logistics_created: {
    label: '物流已创建',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
  },
  picked_up: {
    label: '已取件',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
  in_transit: {
    label: '运输中',
    color: '#0ea5e9',
    bgColor: 'rgba(14, 165, 233, 0.15)',
  },
  warehouse_received: {
    label: '仓库已收货',
    color: '#14b8a6',
    bgColor: 'rgba(20, 184, 166, 0.15)',
  },
  inspecting: {
    label: '验收中',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
  },
  inspection_passed: {
    label: '验收通过',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
  },
  inspection_failed: {
    label: '验收不通过',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.15)',
  },
  refunding: {
    label: '退款中',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
  },
  refund_completed: {
    label: '退款完成',
    color: '#16a34a',
    bgColor: 'rgba(22, 163, 74, 0.15)',
  },
  ticket_created: {
    label: '已生成工单',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.15)',
  },
  completed: {
    label: '已完成',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.15)',
  },
};

export const RETURN_STATUS_OPTIONS: OptionConfig<ReturnStatus>[] = [
  { value: 'pending_review', label: '待审核' },
  { value: 'reviewing', label: '审核中' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'logistics_created', label: '物流已创建' },
  { value: 'picked_up', label: '已取件' },
  { value: 'in_transit', label: '运输中' },
  { value: 'warehouse_received', label: '仓库已收货' },
  { value: 'inspecting', label: '验收中' },
  { value: 'inspection_passed', label: '验收通过' },
  { value: 'inspection_failed', label: '验收不通过' },
  { value: 'refunding', label: '退款中' },
  { value: 'refund_completed', label: '退款完成' },
  { value: 'ticket_created', label: '已生成工单' },
  { value: 'completed', label: '已完成' },
];

export const CUSTOMER_LEVEL_CONFIG: Record<CustomerLevel, StatusConfig> = {
  normal: {
    label: '普通会员',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.15)',
  },
  silver: {
    label: '银卡会员',
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.15)',
  },
  gold: {
    label: '金卡会员',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  platinum: {
    label: '铂金会员',
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.15)',
  },
};

export const CUSTOMER_LEVEL_OPTIONS: OptionConfig<CustomerLevel>[] = [
  { value: 'normal', label: '普通会员' },
  { value: 'silver', label: '银卡会员' },
  { value: 'gold', label: '金卡会员' },
  { value: 'platinum', label: '铂金会员' },
];

export const PRODUCT_CATEGORY_CONFIG: Record<ProductCategory, string> = {
  '手机数码': '手机数码',
  '家用电器': '家用电器',
  '服装鞋帽': '服装鞋帽',
  '美妆护肤': '美妆护肤',
  '食品生鲜': '食品生鲜',
  '家居用品': '家居用品',
  '运动户外': '运动户外',
  '图书文具': '图书文具',
};

export const PRODUCT_CATEGORY_OPTIONS: OptionConfig<ProductCategory>[] = [
  { value: '手机数码', label: '手机数码' },
  { value: '家用电器', label: '家用电器' },
  { value: '服装鞋帽', label: '服装鞋帽' },
  { value: '美妆护肤', label: '美妆护肤' },
  { value: '食品生鲜', label: '食品生鲜' },
  { value: '家居用品', label: '家居用品' },
  { value: '运动户外', label: '运动户外' },
  { value: '图书文具', label: '图书文具' },
];

export const RETURN_REASON_CONFIG: Record<ReturnReason, string> = {
  '商品质量问题': '商品质量问题',
  '与描述不符': '与描述不符',
  '发错商品': '发错商品',
  '商品损坏': '商品损坏',
  '不想要了': '不想要了',
  '尺寸不合适': '尺寸不合适',
  '过期变质': '过期变质',
  '功能异常': '功能异常',
};

export const RETURN_REASON_OPTIONS: OptionConfig<ReturnReason>[] = [
  { value: '商品质量问题', label: '商品质量问题' },
  { value: '与描述不符', label: '与描述不符' },
  { value: '发错商品', label: '发错商品' },
  { value: '商品损坏', label: '商品损坏' },
  { value: '不想要了', label: '不想要了' },
  { value: '尺寸不合适', label: '尺寸不合适' },
  { value: '过期变质', label: '过期变质' },
  { value: '功能异常', label: '功能异常' },
];

export const LIABILITY_PARTY_CONFIG: Record<LiabilityParty, StatusConfig> = {
  customer: {
    label: '客户责任',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  merchant: {
    label: '商家责任',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  logistics: {
    label: '物流责任',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  unknown: {
    label: '责任待定',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
  },
};

export const LIABILITY_PARTY_OPTIONS: OptionConfig<LiabilityParty>[] = [
  { value: 'customer', label: '客户责任' },
  { value: 'merchant', label: '商家责任' },
  { value: 'logistics', label: '物流责任' },
  { value: 'unknown', label: '责任待定' },
];

export const PRIORITY_CONFIG: Record<Priority, StatusConfig> = {
  low: {
    label: '低',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.15)',
  },
  medium: {
    label: '中',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  high: {
    label: '高',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  urgent: {
    label: '紧急',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
};

export const PRIORITY_OPTIONS: OptionConfig<Priority>[] = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
];

export const RETURN_TYPE_CONFIG: Record<ReturnType, string> = {
  exchange: '换货',
  refund: '退货退款',
  refund_only: '仅退款',
};

export const RETURN_TYPE_OPTIONS: OptionConfig<ReturnType>[] = [
  { value: 'exchange', label: '换货' },
  { value: 'refund', label: '退货退款' },
  { value: 'refund_only', label: '仅退款' },
];

export const LOGISTICS_STATUS_CONFIG: Record<LogisticsStatus, StatusConfig> = {
  created: {
    label: '已创建',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.15)',
  },
  picked: {
    label: '已取件',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.15)',
  },
  in_transit: {
    label: '运输中',
    color: '#0ea5e9',
    bgColor: 'rgba(14, 165, 233, 0.15)',
  },
  delivered: {
    label: '已送达',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
  },
  exception: {
    label: '异常',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
};

export const LOGISTICS_STATUS_OPTIONS: OptionConfig<LogisticsStatus>[] = [
  { value: 'created', label: '已创建' },
  { value: 'picked', label: '已取件' },
  { value: 'in_transit', label: '运输中' },
  { value: 'delivered', label: '已送达' },
  { value: 'exception', label: '异常' },
];

export const INSPECTION_RESULT_CONFIG: Record<InspectionResult, StatusConfig> = {
  passed: {
    label: '通过',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
  },
  failed: {
    label: '不通过',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
};

export const INSPECTION_RESULT_OPTIONS: OptionConfig<InspectionResult>[] = [
  { value: 'passed', label: '通过' },
  { value: 'failed', label: '不通过' },
];

export const DAMAGE_LEVEL_CONFIG: Record<DamageLevel, StatusConfig> = {
  none: {
    label: '无损坏',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
  },
  minor: {
    label: '轻微损坏',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  moderate: {
    label: '中度损坏',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.15)',
  },
  severe: {
    label: '严重损坏',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
};

export const DAMAGE_LEVEL_OPTIONS: OptionConfig<DamageLevel>[] = [
  { value: 'none', label: '无损坏' },
  { value: 'minor', label: '轻微损坏' },
  { value: 'moderate', label: '中度损坏' },
  { value: 'severe', label: '严重损坏' },
];

export const REFUND_METHOD_CONFIG: Record<RefundMethod, string> = {
  original: '原路退回',
  points: '积分补偿',
};

export const REFUND_METHOD_OPTIONS: OptionConfig<RefundMethod>[] = [
  { value: 'original', label: '原路退回' },
  { value: 'points', label: '积分补偿' },
];

export const REFUND_STATUS_CONFIG: Record<RefundStatus, StatusConfig> = {
  pending: {
    label: '待处理',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  processing: {
    label: '处理中',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  success: {
    label: '成功',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
  },
  failed: {
    label: '失败',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
};

export const REFUND_STATUS_OPTIONS: OptionConfig<RefundStatus>[] = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
];

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, string> = {
  alipay: '支付宝',
  wechat: '微信支付',
  bank: '银行卡',
  points: '积分',
};

export const PAYMENT_METHOD_OPTIONS: OptionConfig<PaymentMethod>[] = [
  { value: 'alipay', label: '支付宝' },
  { value: 'wechat', label: '微信支付' },
  { value: 'bank', label: '银行卡' },
  { value: 'points', label: '积分' },
];

export const TICKET_STATUS_CONFIG: Record<TicketStatus, StatusConfig> = {
  pending: {
    label: '待处理',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  processing: {
    label: '处理中',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  resolved: {
    label: '已解决',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
  },
  closed: {
    label: '已关闭',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.15)',
  },
};

export const TICKET_STATUS_OPTIONS: OptionConfig<TicketStatus>[] = [
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
];

export const ALERT_TYPE_CONFIG: Record<AlertType, string> = {
  inspection_timeout: '验收超时',
  refund_failed: '退款失败',
  logistics_exception: '物流异常',
  ticket_overdue: '工单逾期',
};

export const ALERT_SEVERITY_CONFIG: Record<AlertSeverity, StatusConfig> = {
  info: {
    label: '提示',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
  },
  warning: {
    label: '警告',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  error: {
    label: '错误',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  critical: {
    label: '严重',
    color: '#dc2626',
    bgColor: 'rgba(220, 38, 38, 0.15)',
  },
};

export const ALERT_STATUS_CONFIG: Record<AlertStatus, string> = {
  unread: '未读',
  read: '已读',
  resolved: '已处理',
};
