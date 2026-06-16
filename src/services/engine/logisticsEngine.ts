export interface Address {
  province: string;
  city: string;
  district: string;
  detail: string;
  postalCode?: string;
  contactName: string;
  contactPhone: string;
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

export interface PackageInfo {
  weight: number;
  volume?: number;
  declaredValue: number;
  fragile: boolean;
  category: string;
}

export interface DispatchPreference {
  priority: 'balanced' | 'efficiency' | 'cost';
  requireInsurance: boolean;
  requirePickup: boolean;
  maxCost?: number;
  maxDays?: number;
}

export interface CourierEvaluation extends Courier {
  estimatedDays: number;
  estimatedCost: number;
  insuranceCost: number;
  pickupFee: number;
  totalCost: number;
  adjustedEfficiencyScore: number;
  adjustedCostScore: number;
  finalScore: number;
  rank: number;
  matchReasons: string[];
  disqualifyReasons: string[];
  eligible: boolean;
}

export interface DispatchResult {
  bestCourier: CourierEvaluation;
  candidates: CourierEvaluation[];
  packageInfo: PackageInfo;
  preference: DispatchPreference;
  pickupAddress: Address;
  returnAddress: Address;
  estimatedPickupTime: string;
  estimatedDeliveryTime: string;
  trackingNumber: string;
}

export const DEFAULT_COURIERS: Courier[] = [
  {
    id: 'sf',
    name: '顺丰速运',
    code: 'SF',
    efficiencyScore: 95,
    costScore: 60,
    overallScore: 80,
    avgDeliveryDays: 1.5,
    avgCost: 18,
    coverageAreas: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'],
    maxWeight: 50,
    supportsPickup: true,
    insuranceRate: 0.005,
  },
  {
    id: 'jd',
    name: '京东物流',
    code: 'JD',
    efficiencyScore: 90,
    costScore: 65,
    overallScore: 78,
    avgDeliveryDays: 1.8,
    avgCost: 16,
    coverageAreas: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州'],
    maxWeight: 60,
    supportsPickup: true,
    insuranceRate: 0.004,
  },
  {
    id: 'zt',
    name: '中通快递',
    code: 'ZTO',
    efficiencyScore: 75,
    costScore: 85,
    overallScore: 80,
    avgDeliveryDays: 3,
    avgCost: 10,
    coverageAreas: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州', '重庆', '天津'],
    maxWeight: 30,
    supportsPickup: true,
    insuranceRate: 0.01,
  },
  {
    id: 'yt',
    name: '圆通速递',
    code: 'YTO',
    efficiencyScore: 72,
    costScore: 88,
    overallScore: 79,
    avgDeliveryDays: 3.2,
    avgCost: 9,
    coverageAreas: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州', '重庆', '天津'],
    maxWeight: 30,
    supportsPickup: true,
    insuranceRate: 0.01,
  },
  {
    id: 'yd',
    name: '韵达快递',
    code: 'YD',
    efficiencyScore: 70,
    costScore: 90,
    overallScore: 78,
    avgDeliveryDays: 3.5,
    avgCost: 8,
    coverageAreas: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州', '重庆', '天津'],
    maxWeight: 25,
    supportsPickup: true,
    insuranceRate: 0.012,
  },
  {
    id: 'ems',
    name: 'EMS',
    code: 'EMS',
    efficiencyScore: 65,
    costScore: 70,
    overallScore: 67,
    avgDeliveryDays: 4,
    avgCost: 15,
    coverageAreas: ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '南京', '苏州', '重庆', '天津'],
    maxWeight: 40,
    supportsPickup: false,
    insuranceRate: 0.008,
  },
];

const PRIORITY_WEIGHTS: Record<DispatchPreference['priority'], { efficiency: number; cost: number; overall: number }> = {
  balanced: { efficiency: 0.4, cost: 0.4, overall: 0.2 },
  efficiency: { efficiency: 0.7, cost: 0.15, overall: 0.15 },
  cost: { efficiency: 0.15, cost: 0.7, overall: 0.15 },
};

function generateTrackingNumber(courierCode: string): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${courierCode}${timestamp}${random}`;
}

export function calculateShippingCost(
  baseCost: number,
  weight: number,
  distance?: number
): number {
  const surcharge = weight > 1 ? (weight - 1) * 2 : 0;
  const distanceSurcharge = distance && distance > 500 ? 5 : 0;
  return Number((baseCost + surcharge + distanceSurcharge).toFixed(2));
}

export function calculateInsuranceCost(
  declaredValue: number,
  insuranceRate: number,
  requireInsurance: boolean
): number {
  if (!requireInsurance && declaredValue < 1000) return 0;
  return Number((declaredValue * insuranceRate).toFixed(2));
}

export function evaluateCourier(
  courier: Courier,
  packageInfo: PackageInfo,
  preference: DispatchPreference,
  pickupAddress: Address,
  returnAddress: Address
): CourierEvaluation {
  const disqualifyReasons: string[] = [];
  const matchReasons: string[] = [];

  if (!courier.coverageAreas.includes(pickupAddress.city)) {
    disqualifyReasons.push(`不覆盖取件城市: ${pickupAddress.city}`);
  }
  if (!courier.coverageAreas.includes(returnAddress.city)) {
    disqualifyReasons.push(`不覆盖退货城市: ${returnAddress.city}`);
  }
  if (packageInfo.weight > courier.maxWeight) {
    disqualifyReasons.push(`超重: ${packageInfo.weight}kg > ${courier.maxWeight}kg`);
  }
  if (preference.requirePickup && !courier.supportsPickup) {
    disqualifyReasons.push('不支持上门取件');
  }

  const estimatedCost = calculateShippingCost(courier.avgCost, packageInfo.weight);
  const insuranceCost = calculateInsuranceCost(
    packageInfo.declaredValue,
    courier.insuranceRate,
    preference.requireInsurance
  );
  const pickupFee = preference.requirePickup && courier.supportsPickup ? 3 : 0;
  const totalCost = Number((estimatedCost + insuranceCost + pickupFee).toFixed(2));

  if (preference.maxCost && totalCost > preference.maxCost) {
    disqualifyReasons.push(`费用超预算: ${totalCost}元 > ${preference.maxCost}元`);
  }

  const estimatedDays = courier.avgDeliveryDays + (packageInfo.fragile ? 0.5 : 0);

  if (preference.maxDays && estimatedDays > preference.maxDays) {
    disqualifyReasons.push(`时效不达标: ${estimatedDays}天 > ${preference.maxDays}天`);
  }

  if (estimatedDays <= 2) {
    matchReasons.push('时效快: 2天内送达');
  }
  if (totalCost <= 12) {
    matchReasons.push('费用低: 12元以内');
  }
  if (courier.supportsPickup) {
    matchReasons.push('支持上门取件');
  }
  if (courier.insuranceRate < 0.006) {
    matchReasons.push('保价费率低');
  }

  const eligible = disqualifyReasons.length === 0;

  const costEfficiencyScore = eligible ? Math.max(0, 100 - (totalCost - 8) * 5) : 0;
  const timeEfficiencyScore = eligible ? Math.max(0, 100 - (estimatedDays - 1) * 15) : 0;

  const adjustedEfficiencyScore = eligible
    ? Number(((courier.efficiencyScore * 0.6) + (timeEfficiencyScore * 0.4)).toFixed(1))
    : 0;
  const adjustedCostScore = eligible
    ? Number(((courier.costScore * 0.6) + (costEfficiencyScore * 0.4)).toFixed(1))
    : 0;

  const weights = PRIORITY_WEIGHTS[preference.priority];
  const finalScore = eligible
    ? Number(((adjustedEfficiencyScore * weights.efficiency) +
        (adjustedCostScore * weights.cost) +
        (courier.overallScore * weights.overall)).toFixed(1))
    : 0;

  return {
    ...courier,
    estimatedDays,
    estimatedCost,
    insuranceCost,
    pickupFee,
    totalCost,
    adjustedEfficiencyScore,
    adjustedCostScore,
    finalScore,
    rank: 0,
    matchReasons,
    disqualifyReasons,
    eligible,
  };
}

export function selectBestCourier(
  packageInfo: PackageInfo,
  preference: DispatchPreference,
  pickupAddress: Address,
  returnAddress: Address,
  availableCouriers: Courier[] = DEFAULT_COURIERS
): DispatchResult {
  const evaluations = availableCouriers
    .map(courier => evaluateCourier(courier, packageInfo, preference, pickupAddress, returnAddress))
    .sort((a, b) => {
      if (a.eligible && !b.eligible) return -1;
      if (!a.eligible && b.eligible) return 1;
      return b.finalScore - a.finalScore;
    });

  const rankedEvaluations = evaluations.map((evalItem, index) => ({
    ...evalItem,
    rank: index + 1,
  }));

  const bestCourier = rankedEvaluations[0];

  const now = new Date();
  const pickupDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const deliveryDate = new Date(pickupDate.getTime() + bestCourier.estimatedDays * 24 * 60 * 60 * 1000);

  return {
    bestCourier,
    candidates: rankedEvaluations,
    packageInfo,
    preference,
    pickupAddress,
    returnAddress,
    estimatedPickupTime: pickupDate.toISOString(),
    estimatedDeliveryTime: deliveryDate.toISOString(),
    trackingNumber: generateTrackingNumber(bestCourier.code),
  };
}

export function getCourierById(id: string, couriers: Courier[] = DEFAULT_COURIERS): Courier | undefined {
  return couriers.find(c => c.id === id);
}

export function getCouriersByCity(city: string, couriers: Courier[] = DEFAULT_COURIERS): Courier[] {
  return couriers.filter(c => c.coverageAreas.includes(city));
}
