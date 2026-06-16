import dayjs from 'dayjs';

export type CustomerLevel = 'normal' | 'silver' | 'gold' | 'platinum';
export type ProductCategory = 'electronics' | 'clothing' | 'food' | 'books' | 'home' | 'beauty' | 'other';
export type ReturnType = 'exchange' | 'refund' | 'refund_only';
export type WarrantyStatus = 'in_warranty' | 'out_of_warranty' | 'no_warranty';

export interface ReturnRequestInput {
  productCategory: ProductCategory;
  productPrice: number;
  purchaseDate: string;
  warrantyExpireDate?: string;
  warrantyMonths?: number;
  customerLevel: CustomerLevel;
  returnReason: string;
  customerRequestedType?: ReturnType;
}

export interface ReturnScheme {
  returnType: ReturnType;
  returnTypeReason: string;
  warrantyStatus: WarrantyStatus;
  warrantyExpireDate?: string;
  daysRemaining?: number;
  daysOverdue?: number;
  depreciationRate: number;
  depreciationAmount: number;
  refundAmount: number;
  originalPrice: number;
  rulesApplied: string[];
}

const WARRANTY_CONFIG: Record<ProductCategory, number> = {
  electronics: 24,
  clothing: 3,
  food: 1,
  books: 6,
  home: 12,
  beauty: 6,
  other: 3,
};

const DEPRECIATION_RATES: Record<ProductCategory, number> = {
  electronics: 0.005,
  clothing: 0.01,
  food: 0.02,
  books: 0.003,
  home: 0.004,
  beauty: 0.008,
  other: 0.006,
};

const MAX_DEPRECIATION_RATE = 0.9;

const CUSTOMER_LEVEL_BONUS: Record<CustomerLevel, { typeUpgrade: boolean; depreciationDiscount: number }> = {
  normal: { typeUpgrade: false, depreciationDiscount: 0 },
  silver: { typeUpgrade: false, depreciationDiscount: 0.05 },
  gold: { typeUpgrade: true, depreciationDiscount: 0.1 },
  platinum: { typeUpgrade: true, depreciationDiscount: 0.15 },
};

const QUALITY_REASONS = ['质量问题', '质量缺陷', '故障', '损坏', '破损', '无法使用', '功能异常'];
const MISMATCH_REASONS = ['与描述不符', '发错货', '型号不符', '颜色不符', '尺寸不符'];

export function isQualityReason(reason: string): boolean {
  return QUALITY_REASONS.some(keyword => reason.includes(keyword));
}

export function isMismatchReason(reason: string): boolean {
  return MISMATCH_REASONS.some(keyword => reason.includes(keyword));
}

export function calculateWarrantyExpireDate(
  purchaseDate: string,
  productCategory: ProductCategory,
  customWarrantyMonths?: number
): string {
  const months = customWarrantyMonths ?? WARRANTY_CONFIG[productCategory];
  return dayjs(purchaseDate).add(months, 'month').format('YYYY-MM-DD');
}

export function checkWarrantyStatus(
  purchaseDate: string,
  warrantyExpireDate?: string,
  productCategory?: ProductCategory,
  customWarrantyMonths?: number
): {
  status: WarrantyStatus;
  expireDate: string;
  daysRemaining: number;
  daysOverdue: number;
} {
  const expire = warrantyExpireDate ?? (productCategory
    ? calculateWarrantyExpireDate(purchaseDate, productCategory, customWarrantyMonths)
    : dayjs(purchaseDate).add(3, 'month').format('YYYY-MM-DD'));

  const expireObj = dayjs(expire);
  const now = dayjs();
  const diffDays = expireObj.diff(now, 'day');

  if (diffDays >= 0) {
    return {
      status: 'in_warranty',
      expireDate: expire,
      daysRemaining: diffDays,
      daysOverdue: 0,
    };
  } else {
    return {
      status: 'out_of_warranty',
      expireDate: expire,
      daysRemaining: 0,
      daysOverdue: Math.abs(diffDays),
    };
  }
}

export function calculateDepreciation(
  productPrice: number,
  productCategory: ProductCategory,
  purchaseDate: string,
  warrantyExpireDate?: string,
  customerLevel: CustomerLevel = 'normal'
): {
  dailyRate: number;
  totalDays: number;
  rawRate: number;
  discountedRate: number;
  finalRate: number;
  depreciationAmount: number;
  refundAmount: number;
} {
  const dailyRate = DEPRECIATION_RATES[productCategory];
  const purchaseObj = dayjs(purchaseDate);
  const expireObj = warrantyExpireDate ? dayjs(warrantyExpireDate) : dayjs();
  const totalDays = Math.max(0, dayjs().diff(purchaseObj, 'day'));
  const warrantyDays = Math.max(0, expireObj.diff(purchaseObj, 'day'));
  const overDays = Math.max(0, totalDays - warrantyDays);

  const rawRate = Math.min(overDays * dailyRate, MAX_DEPRECIATION_RATE);
  const discount = CUSTOMER_LEVEL_BONUS[customerLevel].depreciationDiscount;
  const discountedRate = Math.max(0, rawRate - discount);
  const finalRate = Math.min(discountedRate, MAX_DEPRECIATION_RATE);

  const depreciationAmount = Number((productPrice * finalRate).toFixed(2));
  const refundAmount = Number((productPrice - depreciationAmount).toFixed(2));

  return {
    dailyRate,
    totalDays,
    rawRate,
    discountedRate,
    finalRate,
    depreciationAmount,
    refundAmount,
  };
}

export function determineReturnType(
  productCategory: ProductCategory,
  purchaseDate: string,
  customerLevel: CustomerLevel,
  returnReason: string,
  warrantyStatus: WarrantyStatus,
  customerRequestedType?: ReturnType
): {
  type: ReturnType;
  reason: string;
} {
  const rulesApplied: string[] = [];
  const daysSincePurchase = dayjs().diff(dayjs(purchaseDate), 'day');

  if (productCategory === 'food') {
    if (daysSincePurchase <= 7) {
      return { type: 'refund', reason: '食品类商品7天内支持退款' };
    }
    return { type: 'refund_only', reason: '食品类商品超7天仅支持退款不退货' };
  }

  if (isQualityReason(returnReason)) {
    rulesApplied.push('质量问题优先处理');
    if (warrantyStatus === 'in_warranty') {
      return { type: 'exchange', reason: '保修期内质量问题优先换货' };
    }
    return { type: 'refund', reason: '超保修期质量问题支持退款' };
  }

  if (isMismatchReason(returnReason)) {
    return { type: 'exchange', reason: '商品与描述不符支持换货' };
  }

  if (daysSincePurchase <= 7) {
    if (customerRequestedType) {
      return { type: customerRequestedType, reason: `7天无理由退换，按客户申请：${customerRequestedType === 'exchange' ? '换货' : customerRequestedType === 'refund' ? '退款' : '仅退款'}` };
    }
    return { type: 'refund', reason: '7天无理由退换' };
  }

  if (daysSincePurchase <= 15) {
    const bonus = CUSTOMER_LEVEL_BONUS[customerLevel];
    if (bonus.typeUpgrade) {
      return { type: 'exchange', reason: `${customerLevel === 'gold' ? '黄金' : '铂金'}会员15天内支持换货` };
    }
    return { type: 'refund_only', reason: '超过7天但在15天内，仅支持退款不退货' };
  }

  if (warrantyStatus === 'in_warranty') {
    return { type: 'exchange', reason: '保修期内支持换货' };
  }

  return { type: 'refund_only', reason: '超出售后期限，仅支持折价退款' };
}

export function generateReturnScheme(input: ReturnRequestInput): ReturnScheme {
  const rulesApplied: string[] = [];

  const warrantyInfo = checkWarrantyStatus(
    input.purchaseDate,
    input.warrantyExpireDate,
    input.productCategory,
    input.warrantyMonths
  );
  rulesApplied.push(`保修期校验：${warrantyInfo.status === 'in_warranty' ? '在保内，剩余' + warrantyInfo.daysRemaining + '天' : '超保' + warrantyInfo.daysOverdue + '天'}`);

  const returnTypeInfo = determineReturnType(
    input.productCategory,
    input.purchaseDate,
    input.customerLevel,
    input.returnReason,
    warrantyInfo.status,
    input.customerRequestedType
  );
  rulesApplied.push(`退货类型判定：${returnTypeInfo.reason}`);

  const depreciation = calculateDepreciation(
    input.productPrice,
    input.productCategory,
    input.purchaseDate,
    warrantyInfo.expireDate,
    input.customerLevel
  );

  if (depreciation.finalRate > 0) {
    rulesApplied.push(`折旧计算：日折旧率${(depreciation.dailyRate * 100).toFixed(2)}%，使用${depreciation.totalDays}天，折旧率${(depreciation.finalRate * 100).toFixed(2)}%，折旧金额${depreciation.depreciationAmount}元`);
  }

  if (input.customerLevel !== 'normal') {
    const discount = (CUSTOMER_LEVEL_BONUS[input.customerLevel].depreciationDiscount * 100).toFixed(0);
    rulesApplied.push(`会员权益：${input.customerLevel === 'silver' ? '白银' : input.customerLevel === 'gold' ? '黄金' : '铂金'}会员折旧减免${discount}%`);
  }

  const finalRefundAmount = returnTypeInfo.type === 'exchange' ? 0 : depreciation.refundAmount;
  const finalDepreciationAmount = returnTypeInfo.type === 'exchange' ? 0 : depreciation.depreciationAmount;
  const finalDepreciationRate = returnTypeInfo.type === 'exchange' ? 0 : depreciation.finalRate;

  return {
    returnType: returnTypeInfo.type,
    returnTypeReason: returnTypeInfo.reason,
    warrantyStatus: warrantyInfo.status,
    warrantyExpireDate: warrantyInfo.expireDate,
    daysRemaining: warrantyInfo.daysRemaining,
    daysOverdue: warrantyInfo.daysOverdue,
    depreciationRate: finalDepreciationRate,
    depreciationAmount: finalDepreciationAmount,
    refundAmount: finalRefundAmount,
    originalPrice: input.productPrice,
    rulesApplied,
  };
}
