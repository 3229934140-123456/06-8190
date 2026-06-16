import dayjs from 'dayjs';

export type PaymentMethod = 'alipay' | 'wechat' | 'unionpay' | 'bank_card' | 'credit_card' | 'points' | 'balance' | 'cod';
export type RefundMethod = 'original' | 'points' | 'balance' | 'bank_transfer';
export type RefundStatus = 'pending' | 'processing' | 'success' | 'failed' | 'reversed';
export type RefundFailureReason =
  | 'account_closed'
  | 'account_frozen'
  | 'channel_unavailable'
  | 'exceeded_time_limit'
  | 'insufficient_points'
  | 'invalid_transaction'
  | 'network_error'
  | 'unknown';

export interface PaymentRecord {
  transactionId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paidAt: string;
  channelTransactionId?: string;
  pointsUsed?: number;
  cardLastFour?: string;
  bankName?: string;
}

export interface CustomerInfo {
  customerId: string;
  customerLevel: 'normal' | 'silver' | 'gold' | 'platinum';
  availablePoints: number;
  accountBalance: number;
  pointsExchangeRate: number;
}

export interface RefundRouteInput {
  returnId: string;
  orderId: string;
  refundAmount: number;
  payment: PaymentRecord;
  customer: CustomerInfo;
  preferPoints?: boolean;
  allowPartialPoints?: boolean;
}

export interface RefundRouteResult {
  returnId: string;
  orderId: string;
  refundMethod: RefundMethod;
  refundMethodName: string;
  totalRefundAmount: number;
  originalAmount: number;
  pointsAmount: number;
  pointsToDeduct: number;
  estimatedProcessingTime: string;
  processingFee: number;
  feeExempted: boolean;
  rulesApplied: string[];
  warnings: string[];
  fallbackAvailable: RefundMethod[];
  transactionId: string;
}

export interface RefundResult {
  refundId: string;
  returnId: string;
  orderId: string;
  refundMethod: RefundMethod;
  refundAmount: number;
  pointsDeducted: number;
  status: RefundStatus;
  transactionId: string;
  failureReason?: RefundFailureReason;
  failureMessage?: string;
  processedAt: string;
  retryCount: number;
}

const REFUND_TIME_LIMIT_DAYS: Record<PaymentMethod, number> = {
  alipay: 365,
  wechat: 365,
  unionpay: 180,
  bank_card: 90,
  credit_card: 180,
  points: 3650,
  balance: 3650,
  cod: 30,
};

const PROCESSING_TIMES: Record<RefundMethod, string> = {
  original: '1-3个工作日',
  points: '即时到账',
  balance: '即时到账',
  bank_transfer: '3-5个工作日',
};

const PROCESSING_FEES: Record<PaymentMethod, number> = {
  alipay: 0.006,
  wechat: 0.006,
  unionpay: 0.008,
  bank_card: 0.01,
  credit_card: 0.012,
  points: 0,
  balance: 0,
  cod: 0.015,
};

const FEE_EXEMPT_LEVELS: CustomerInfo['customerLevel'][] = ['gold', 'platinum'];
const POINTS_BONUS_LEVELS: Record<CustomerInfo['customerLevel'], number> = {
  normal: 1,
  silver: 1.05,
  gold: 1.1,
  platinum: 1.2,
};

function generateRefundTransactionId(): string {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RF${timestamp}${random}`;
}

export function isWithinRefundTimeLimit(payment: PaymentRecord): boolean {
  const limitDays = REFUND_TIME_LIMIT_DAYS[payment.paymentMethod];
  const daysSincePayment = dayjs().diff(dayjs(payment.paidAt), 'day');
  return daysSincePayment <= limitDays;
}

export function getDaysSincePayment(payment: PaymentRecord): number {
  return dayjs().diff(dayjs(payment.paidAt), 'day');
}

export function calculateProcessingFee(
  refundAmount: number,
  paymentMethod: PaymentMethod,
  customerLevel: CustomerInfo['customerLevel']
): { fee: number; exempted: boolean } {
  const exempted = FEE_EXEMPT_LEVELS.includes(customerLevel);
  if (exempted) {
    return { fee: 0, exempted: true };
  }
  const feeRate = PROCESSING_FEES[paymentMethod];
  const fee = Number((refundAmount * feeRate).toFixed(2));
  return { fee, exempted: false };
}

export function calculatePointsEquivalent(
  amount: number,
  exchangeRate: number,
  customerLevel: CustomerInfo['customerLevel']
): number {
  const bonus = POINTS_BONUS_LEVELS[customerLevel];
  return Math.floor(amount * exchangeRate * bonus);
}

export function getAvailableRefundMethods(
  payment: PaymentRecord,
  customer: CustomerInfo,
  refundAmount: number
): { method: RefundMethod; available: boolean; reason?: string }[] {
  const results: { method: RefundMethod; available: boolean; reason?: string }[] = [];

  const withinLimit = isWithinRefundTimeLimit(payment);
  results.push({
    method: 'original',
    available: withinLimit && payment.paymentMethod !== 'cod',
    reason: !withinLimit
      ? `超出${REFUND_TIME_LIMIT_DAYS[payment.paymentMethod]}天退款时效`
      : payment.paymentMethod === 'cod'
      ? '货到付款不支持原路退回'
      : undefined,
  });

  const pointsNeeded = Math.ceil(refundAmount * customer.pointsExchangeRate);
  results.push({
    method: 'points',
    available: customer.availablePoints >= pointsNeeded,
    reason: customer.availablePoints < pointsNeeded
      ? `积分不足，需要${pointsNeeded}积分，当前仅有${customer.availablePoints}积分`
      : undefined,
  });

  results.push({
    method: 'balance',
    available: true,
  });

  results.push({
    method: 'bank_transfer',
    available: true,
  });

  return results;
}

export function determineRefundMethod(
  input: RefundRouteInput
): { method: RefundMethod; reason: string } {
  const { payment, customer, refundAmount, preferPoints, allowPartialPoints } = input;

  if (payment.paymentMethod === 'points') {
    return { method: 'points', reason: '原支付方式为积分，原路退回积分' };
  }

  if (payment.paymentMethod === 'balance') {
    return { method: 'balance', reason: '原支付方式为余额，原路退回余额' };
  }

  if (preferPoints) {
    const pointsNeeded = Math.ceil(refundAmount * customer.pointsExchangeRate);
    if (customer.availablePoints >= pointsNeeded) {
      return { method: 'points', reason: '客户选择积分补偿' };
    }
    if (allowPartialPoints && customer.availablePoints > 0) {
      return { method: 'points', reason: '客户选择积分补偿（部分抵扣）' };
    }
  }

  if (isWithinRefundTimeLimit(payment)) {
    return { method: 'original', reason: '在退款时效内，原路退回至原支付账户' };
  }

  if (customer.customerLevel === 'platinum' || customer.customerLevel === 'gold') {
    return { method: 'balance', reason: '超出时效，优质会员退款至账户余额' };
  }

  return { method: 'bank_transfer', reason: '超出原路退回时效，转为银行转账' };
}

export function routeRefund(input: RefundRouteInput): RefundRouteResult {
  const rulesApplied: string[] = [];
  const warnings: string[] = [];

  const refundMethodInfo = determineRefundMethod(input);
  rulesApplied.push(`退款方式判定：${refundMethodInfo.reason}`);

  const availableMethods = getAvailableRefundMethods(input.payment, input.customer, input.refundAmount);
  const fallbackAvailable = availableMethods
    .filter(m => m.available && m.method !== refundMethodInfo.method)
    .map(m => m.method);

  if (!availableMethods.find(m => m.method === refundMethodInfo.method)?.available) {
    warnings.push(`首选退款方式不可用，建议使用备选方案: ${fallbackAvailable.join(', ')}`);
  }

  const daysSincePayment = getDaysSincePayment(input.payment);
  const limitDays = REFUND_TIME_LIMIT_DAYS[input.payment.paymentMethod];
  if (daysSincePayment > limitDays * 0.8) {
    warnings.push(`原支付已使用${daysSincePayment}天，接近${limitDays}天退款时效上限`);
  }

  const feeInfo = calculateProcessingFee(
    input.refundAmount,
    input.payment.paymentMethod,
    input.customer.customerLevel
  );

  if (feeInfo.exempted) {
    rulesApplied.push(`会员权益：${input.customer.customerLevel === 'gold' ? '黄金' : '铂金'}会员免手续费`);
  } else if (feeInfo.fee > 0) {
    rulesApplied.push(`手续费：${(PROCESSING_FEES[input.payment.paymentMethod] * 100).toFixed(1)}%，共计${feeInfo.fee}元`);
  }

  let pointsAmount = 0;
  let pointsToDeduct = 0;
  let originalAmount = input.refundAmount;

  if (refundMethodInfo.method === 'points') {
    pointsAmount = calculatePointsEquivalent(
      input.refundAmount,
      input.customer.pointsExchangeRate,
      input.customer.customerLevel
    );
    pointsToDeduct = Math.min(pointsAmount, input.customer.availablePoints);
    originalAmount = pointsToDeduct < pointsAmount ? input.refundAmount * (pointsToDeduct / pointsAmount) : 0;
    const bonus = ((POINTS_BONUS_LEVELS[input.customer.customerLevel] - 1) * 100).toFixed(0);
    if (bonus !== '0') {
      rulesApplied.push(`会员积分加成：${input.customer.customerLevel === 'silver' ? '白银' : input.customer.customerLevel === 'gold' ? '黄金' : '铂金'}会员额外${bonus}%积分`);
    }
  }

  return {
    returnId: input.returnId,
    orderId: input.orderId,
    refundMethod: refundMethodInfo.method,
    refundMethodName: refundMethodInfo.method === 'original' ? '原路退回'
      : refundMethodInfo.method === 'points' ? '积分补偿'
      : refundMethodInfo.method === 'balance' ? '账户余额'
      : '银行转账',
    totalRefundAmount: input.refundAmount,
    originalAmount,
    pointsAmount,
    pointsToDeduct,
    estimatedProcessingTime: PROCESSING_TIMES[refundMethodInfo.method],
    processingFee: feeInfo.fee,
    feeExempted: feeInfo.exempted,
    rulesApplied,
    warnings,
    fallbackAvailable,
    transactionId: generateRefundTransactionId(),
  };
}

export function executeRefund(routeResult: RefundRouteResult): RefundResult {
  const success = Math.random() > 0.08;

  if (success) {
    return {
      refundId: generateRefundTransactionId(),
      returnId: routeResult.returnId,
      orderId: routeResult.orderId,
      refundMethod: routeResult.refundMethod,
      refundAmount: routeResult.totalRefundAmount,
      pointsDeducted: routeResult.pointsToDeduct,
      status: 'success',
      transactionId: routeResult.transactionId,
      processedAt: new Date().toISOString(),
      retryCount: 0,
    };
  }

  const failureReasons: RefundFailureReason[] = [
    'account_closed',
    'account_frozen',
    'channel_unavailable',
    'network_error',
  ];
  const randomReason = failureReasons[Math.floor(Math.random() * failureReasons.length)];

  return {
    refundId: generateRefundTransactionId(),
    returnId: routeResult.returnId,
    orderId: routeResult.orderId,
    refundMethod: routeResult.refundMethod,
    refundAmount: routeResult.totalRefundAmount,
    pointsDeducted: 0,
    status: 'failed',
    transactionId: routeResult.transactionId,
    failureReason: randomReason,
    failureMessage: getFailureReasonMessage(randomReason),
    processedAt: new Date().toISOString(),
    retryCount: 0,
  };
}

export function getFailureReasonMessage(reason: RefundFailureReason): string {
  const messages: Record<RefundFailureReason, string> = {
    account_closed: '收款账户已注销',
    account_frozen: '收款账户已被冻结',
    channel_unavailable: '支付渠道暂不可用',
    exceeded_time_limit: '超出退款时效',
    insufficient_points: '积分余额不足',
    invalid_transaction: '交易记录无效',
    network_error: '网络连接异常',
    unknown: '未知错误',
  };
  return messages[reason];
}

export function retryRefund(previousResult: RefundResult, routeResult: RefundRouteResult): RefundResult {
  const maxRetries = 3;
  if (previousResult.retryCount >= maxRetries) {
    return {
      ...previousResult,
      status: 'failed',
      retryCount: previousResult.retryCount,
      failureMessage: `${previousResult.failureMessage}，已达最大重试次数(${maxRetries}次)`,
    };
  }

  const newResult = executeRefund(routeResult);
  return {
    ...newResult,
    retryCount: previousResult.retryCount + 1,
  };
}
