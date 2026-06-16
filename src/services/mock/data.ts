import dayjs from 'dayjs'
import type {
  ReturnStatus,
  CustomerLevel,
  ReturnType,
  PaymentMethod,
  RefundMethod,
  TimelineEvent,
  Address,
  ReturnRequest,
  Courier,
  LogisticsOrder,
  InspectionRecord,
  RefundRecord,
  LiabilityTicket,
  Alert,
  OperationLog,
  ReportData,
} from '@/types'

let addrIdCounter = 1

const PRODUCT_CATEGORIES = ['手机数码', '家用电器', '服装鞋帽', '美妆护肤', '食品生鲜', '家居用品', '运动户外', '图书文具']
const RETURN_REASONS = ['商品质量问题', '与描述不符', '发错商品', '商品损坏', '不想要了', '尺寸不合适', '过期变质', '功能异常']
const CUSTOMER_LEVELS: CustomerLevel[] = ['normal', 'silver', 'gold', 'platinum']
const RETURN_TYPES: ReturnType[] = ['refund', 'exchange', 'refund_only']
const OPERATORS = ['张经理', '李主管', '王专员', '赵客服', '陈验收', '刘财务', '孙调度', '周审核']
const PRODUCTS: { name: string; category: string; price: number }[] = [
  { name: 'iPhone 15 Pro Max 256GB', category: '手机数码', price: 9999 },
  { name: '华为 Mate60 Pro 512GB', category: '手机数码', price: 7999 },
  { name: '小米14 Ultra 摄影套装', category: '手机数码', price: 6499 },
  { name: '海尔对开门冰箱 500L', category: '家用电器', price: 4599 },
  { name: '美的空调挂机 1.5匹', category: '家用电器', price: 2999 },
  { name: '西门子滚筒洗衣机 10kg', category: '家用电器', price: 5299 },
  { name: '耐克 Air Max 跑步鞋', category: '服装鞋帽', price: 899 },
  { name: '优衣库羽绒服 男款', category: '服装鞋帽', price: 599 },
  { name: '阿迪达斯运动套装', category: '服装鞋帽', price: 799 },
  { name: 'SK-II 神仙水 230ml', category: '美妆护肤', price: 1590 },
  { name: '兰蔻小黑瓶精华 50ml', category: '美妆护肤', price: 1080 },
  { name: '雅诗兰黛小棕瓶 50ml', category: '美妆护肤', price: 980 },
  { name: '三只松鼠坚果大礼包', category: '食品生鲜', price: 168 },
  { name: '蒙牛纯牛奶 24盒', category: '食品生鲜', price: 89 },
  { name: '智利车厘子 5斤装', category: '食品生鲜', price: 299 },
  { name: '宜家北欧风沙发三人座', category: '家居用品', price: 3599 },
  { name: '无印良品四件套床品', category: '家居用品', price: 499 },
  { name: '戴森吸尘器 V15', category: '家用电器', price: 4990 },
  { name: '迪卡侬登山背包 40L', category: '运动户外', price: 299 },
  { name: '李宁羽毛球拍双拍套装', category: '运动户外', price: 399 },
  { name: 'Kindle Paperwhite 电子书', category: '图书文具', price: 1299 },
  { name: '晨光钢笔礼盒套装', category: '图书文具', price: 199 },
  { name: '索尼 WH-1000XM5 耳机', category: '手机数码', price: 2899 },
  { name: '戴森吹风机 HD15', category: '家用电器', price: 3199 },
]
const CUSTOMER_NAMES = ['王小明', '李华', '张伟', '刘洋', '陈静', '杨帆', '赵磊', '黄丽', '周杰', '吴敏', '徐强', '孙娜', '马超', '朱琳', '胡军', '郭芳', '何勇', '罗燕', '梁宇', '宋佳', '唐亮', '韩雪', '冯刚', '董洁', '萧然', '程诚', '曹颖', '袁野', '邓萍', '许峰', '傅蓉', '沈阳', '曾磊', '彭娟', '吕刚', '苏婷', '卢伟', '蒋梅', '蔡宁', '贾斌']
const PROVINCES = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '山东省', '福建省', '湖南省']
const CITIES: Record<string, string[]> = {
  '北京市': ['朝阳区', '海淀区', '东城区', '西城区', '丰台区'],
  '上海市': ['浦东新区', '黄浦区', '静安区', '徐汇区', '长宁区'],
  '广东省': ['广州市', '深圳市', '东莞市', '佛山市', '珠海市'],
  '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '绍兴市'],
  '江苏省': ['南京市', '苏州市', '无锡市', '常州市', '南通市'],
  '四川省': ['成都市', '绵阳市', '德阳市', '宜宾市', '泸州市'],
  '湖北省': ['武汉市', '宜昌市', '襄阳市', '荆州市', '黄冈市'],
  '山东省': ['济南市', '青岛市', '烟台市', '潍坊市', '临沂市'],
  '福建省': ['福州市', '厦门市', '泉州市', '漳州市', '莆田市'],
  '湖南省': ['长沙市', '株洲市', '湘潭市', '衡阳市', '岳阳市'],
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number, decimals: number = 2): number {
  return Number((Math.random() * (max - min) + min).toFixed(decimals))
}

function pad(num: number, length: number = 2): string {
  return num.toString().padStart(length, '0')
}

function generatePhone(): string {
  return `1${randomInt(3, 9)}${pad(randomInt(0, 999999999), 9)}`
}

function generateIp(): string {
  return `${randomInt(1, 255)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 255)}`
}

function generateAddress(): Address {
  const province = randomChoice(PROVINCES)
  const city = randomChoice(CITIES[province])
  const streets = ['中山路', '人民路', '解放路', '建设路', '文化路', '长江路', '黄河路', '珠江路']
  return {
    id: `ADDR${pad(addrIdCounter++, 6)}`,
    province,
    city,
    district: randomChoice(['XX区', 'YY区', 'ZZ区']),
    detail: `${randomChoice(streets)}${randomInt(1, 999)}号${randomChoice(['小区', '大厦', '公寓', '花园'])}${randomInt(1, 30)}栋${randomInt(1, 30)}${randomInt(101, 3500)}室`,
    contactPhone: generatePhone(),
    contactName: randomChoice(CUSTOMER_NAMES),
  }
}

function generateTimeline(baseDate: dayjs.Dayjs, status: ReturnStatus): TimelineEvent[] {
  const timeline: TimelineEvent[] = []
  let currentDate = baseDate.clone()
  const allStatuses: ReturnStatus[] = [
    'pending_review', 'reviewing', 'approved', 'logistics_created',
    'picked_up', 'in_transit', 'warehouse_received', 'inspecting',
  ]

  const statusIndex = allStatuses.indexOf(status)
  const eventsToGenerate = statusIndex === -1 ? allStatuses.length : statusIndex + 1

  for (let i = 0; i < eventsToGenerate; i++) {
    const s = allStatuses[i]
    timeline.push({
      status: s,
      timestamp: currentDate.format('YYYY-MM-DD HH:mm:ss'),
      operator: randomChoice(OPERATORS),
      remark: s === 'approved' ? '方案审批通过，同意退货退款' : s === 'pending_review' ? '用户提交退货申请' : undefined,
    })
    currentDate = currentDate.add(randomInt(1, 180), 'minute')
  }

  if (status === 'inspection_passed' || status === 'refunding' || status === 'refund_completed' || status === 'completed') {
    timeline.push({
      status: 'inspection_passed',
      timestamp: currentDate.format('YYYY-MM-DD HH:mm:ss'),
      operator: randomChoice(OPERATORS.filter(o => o.includes('验收') || o.includes('陈'))),
      remark: '商品验收通过，完好无损',
    })
    currentDate = currentDate.add(randomInt(30, 120), 'minute')
  }

  if (status === 'inspection_failed' || status === 'ticket_created') {
    timeline.push({
      status: 'inspection_failed',
      timestamp: currentDate.format('YYYY-MM-DD HH:mm:ss'),
      operator: randomChoice(OPERATORS.filter(o => o.includes('验收') || o.includes('陈'))),
      remark: '商品存在损坏，需责任判定',
    })
    if (status === 'ticket_created') {
      currentDate = currentDate.add(randomInt(30, 90), 'minute')
      timeline.push({
        status: 'ticket_created',
        timestamp: currentDate.format('YYYY-MM-DD HH:mm:ss'),
        operator: '系统自动',
        remark: '已生成责任判定工单',
      })
    }
  }

  if (status === 'refunding' || status === 'refund_completed' || status === 'completed') {
    timeline.push({
      status: 'refunding',
      timestamp: currentDate.format('YYYY-MM-DD HH:mm:ss'),
      operator: randomChoice(OPERATORS.filter(o => o.includes('财务') || o.includes('刘'))),
      remark: '退款处理中',
    })
    currentDate = currentDate.add(randomInt(60, 240), 'minute')
  }

  if (status === 'refund_completed' || status === 'completed') {
    timeline.push({
      status: 'refund_completed',
      timestamp: currentDate.format('YYYY-MM-DD HH:mm:ss'),
      operator: '系统自动',
      remark: '退款已成功到账',
    })
  }

  if (status === 'completed') {
    currentDate = currentDate.add(randomInt(10, 60), 'minute')
    timeline.push({
      status: 'completed',
      timestamp: currentDate.format('YYYY-MM-DD HH:mm:ss'),
      operator: '系统自动',
      remark: '退货流程已完成',
    })
  }

  if (status === 'rejected') {
    timeline.length = 0
    timeline.push({
      status: 'pending_review',
      timestamp: baseDate.format('YYYY-MM-DD HH:mm:ss'),
      operator: randomChoice(CUSTOMER_NAMES),
      remark: '用户提交退货申请',
    })
    baseDate.add(randomInt(30, 120), 'minute')
    timeline.push({
      status: 'reviewing',
      timestamp: baseDate.add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      operator: randomChoice(OPERATORS.filter(o => o.includes('审核') || o.includes('周'))),
      remark: '审核中',
    })
    timeline.push({
      status: 'rejected',
      timestamp: baseDate.add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      operator: randomChoice(OPERATORS.filter(o => o.includes('审核') || o.includes('周'))),
      remark: '驳回：商品已使用且非质量问题',
    })
  }

  return timeline
}

const STATUSES: ReturnStatus[] = [
  'pending_review', 'reviewing', 'approved', 'rejected',
  'logistics_created', 'picked_up', 'in_transit', 'warehouse_received',
  'inspecting', 'inspection_passed', 'inspection_failed',
  'refunding', 'refund_completed', 'ticket_created', 'completed',
]

const WAREHOUSE_ADDRESS: Address = {
  id: 'ADDR000000',
  province: '上海市',
  city: '上海市',
  district: '浦东新区',
  detail: '张江高科技园区博云路2号浦东软件园1号楼',
  contactPhone: '021-88889999',
  contactName: '仓库收',
}

export const couriers: Courier[] = [
  { id: 'CR001', name: '顺丰速运', code: 'SF', efficiencyScore: 95, costScore: 72, overallScore: 87, avgDeliveryDays: 2, avgCost: 18, coverageAreas: ['北京市', '上海市', '广州市', '深圳市'], maxWeight: 50, supportsPickup: true, insuranceRate: 0.01 },
  { id: 'CR002', name: '京东物流', code: 'JD', efficiencyScore: 92, costScore: 78, overallScore: 87, avgDeliveryDays: 2, avgCost: 15, coverageAreas: ['北京市', '上海市', '广州市', '深圳市', '杭州市'], maxWeight: 50, supportsPickup: true, insuranceRate: 0.008 },
  { id: 'CR003', name: '圆通速递', code: 'YT', efficiencyScore: 78, costScore: 90, overallScore: 82, avgDeliveryDays: 4, avgCost: 10, coverageAreas: ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市'], maxWeight: 30, supportsPickup: true, insuranceRate: 0.005 },
  { id: 'CR004', name: '中通快递', code: 'ZTO', efficiencyScore: 80, costScore: 92, overallScore: 84, avgDeliveryDays: 4, avgCost: 9, coverageAreas: ['北京市', '上海市', '广州市', '深圳市', '杭州市', '南京市', '成都市'], maxWeight: 30, supportsPickup: true, insuranceRate: 0.005 },
  { id: 'CR005', name: '韵达快递', code: 'YD', efficiencyScore: 76, costScore: 88, overallScore: 80, avgDeliveryDays: 5, avgCost: 9, coverageAreas: ['北京市', '上海市', '广州市', '深圳市', '杭州市', '武汉市'], maxWeight: 30, supportsPickup: true, insuranceRate: 0.005 },
  { id: 'CR006', name: '德邦快递', code: 'DB', efficiencyScore: 85, costScore: 75, overallScore: 81, avgDeliveryDays: 3, avgCost: 14, coverageAreas: ['北京市', '上海市', '广州市', '深圳市'], maxWeight: 100, supportsPickup: true, insuranceRate: 0.006 },
  { id: 'CR007', name: '邮政EMS', code: 'EMS', efficiencyScore: 70, costScore: 85, overallScore: 76, avgDeliveryDays: 6, avgCost: 12, coverageAreas: ['北京市', '上海市', '广州市', '深圳市', '全国'], maxWeight: 50, supportsPickup: false, insuranceRate: 0.01 },
]

const returnRequests: ReturnRequest[] = []
const logisticsOrders: LogisticsOrder[] = []
const inspectionRecords: InspectionRecord[] = []
const refundRecords: RefundRecord[] = []
const liabilityTickets: LiabilityTicket[] = []
const alerts: Alert[] = []
const operationLogs: OperationLog[] = []

for (let i = 1; i <= 50; i++) {
  const idx = i - 1
  const product = PRODUCTS[idx % PRODUCTS.length]
  const customerLevel = CUSTOMER_LEVELS[idx % CUSTOMER_LEVELS.length]
  const status = STATUSES[idx % STATUSES.length]
  const orderDate = dayjs('2026-01-01').add(randomInt(0, 150), 'day')
  const createdAt = dayjs('2026-05-01').add(Math.floor(idx / 2), 'day').add(randomInt(0, 23), 'hour').add(randomInt(0, 59), 'minute')
  const warrantyExpireDate = orderDate.add(randomInt(90, 730), 'day')
  const inWarranty = warrantyExpireDate.isAfter(createdAt)
  const depreciationRate = inWarranty ? 0 : randomFloat(0.05, 0.4)
  const depreciationAmount = Number((product.price * depreciationRate).toFixed(2))
  const refundAmount = Number((product.price - depreciationAmount).toFixed(2))

  const returnRequest: ReturnRequest = {
    id: `RT${pad(20260000 + i, 8)}`,
    orderId: `ORD${pad(100000 + i * 37, 8)}`,
    orderDate: orderDate.format('YYYY-MM-DD HH:mm:ss'),
    productId: `PRD${pad(1000 + (idx % PRODUCTS.length), 6)}`,
    productName: product.name,
    productCategory: product.category,
    productPrice: product.price,
    customerId: `CUS${pad(10000 + randomInt(0, 9999), 6)}`,
    customerName: CUSTOMER_NAMES[idx % CUSTOMER_NAMES.length],
    customerLevel,
    returnReason: RETURN_REASONS[idx % RETURN_REASONS.length],
    returnType: RETURN_TYPES[idx % RETURN_TYPES.length],
    warrantyExpireDate: warrantyExpireDate.format('YYYY-MM-DD'),
    inWarranty,
    depreciationRate,
    depreciationAmount,
    refundAmount,
    status,
    createdAt: createdAt.format('YYYY-MM-DD HH:mm:ss'),
    updatedAt: createdAt.add(randomInt(2, 72), 'hour').format('YYYY-MM-DD HH:mm:ss'),
    timeline: generateTimeline(createdAt, status),
  }
  returnRequests.push(returnRequest)

  if (['logistics_created', 'picked_up', 'in_transit', 'warehouse_received',
       'inspecting', 'inspection_passed', 'inspection_failed',
       'refunding', 'refund_completed', 'ticket_created', 'completed'].includes(status)) {
    const courier = randomChoice(couriers)
    const isException = randomInt(1, 20) === 1
    const logisticsStatus: LogisticsOrder['status'] =
      isException ? 'exception' :
      status === 'logistics_created' ? 'created' :
      status === 'picked_up' ? 'picked' :
      status === 'in_transit' ? 'in_transit' :
      ['warehouse_received', 'inspecting', 'inspection_passed', 'inspection_failed',
       'refunding', 'refund_completed', 'ticket_created', 'completed'].includes(status) ? 'delivered' : 'in_transit'

    logisticsOrders.push({
      id: `LO${pad(20260000 + i, 8)}`,
      returnId: returnRequest.id,
      orderId: returnRequest.orderId,
      courierId: courier.id,
      courierName: courier.name,
      trackingNumber: `${courier.name.substring(0, 2)}${randomInt(1000000000, 9999999999)}`,
      estimatedCost: courier.avgCost + randomFloat(-2, 3),
      actualCost: logisticsStatus === 'delivered' || logisticsStatus === 'exception' ? courier.avgCost + randomFloat(-2, 5) : 0,
      estimatedDays: courier.avgDeliveryDays,
      actualDays: logisticsStatus === 'delivered' ? courier.avgDeliveryDays + randomInt(-1, 2) : 0,
      status: logisticsStatus,
      pickupAddress: generateAddress(),
      returnAddress: WAREHOUSE_ADDRESS,
      createdAt: createdAt.add(randomInt(30, 240), 'minute').format('YYYY-MM-DD HH:mm:ss'),
    })
  }

  if (['inspecting', 'inspection_passed', 'inspection_failed',
       'refunding', 'refund_completed', 'ticket_created', 'completed'].includes(status)) {
    const passed = status !== 'inspection_failed' && status !== 'ticket_created' ? randomChoice([true, true, true, false]) : false
    inspectionRecords.push({
      id: `IR${pad(20260000 + i, 8)}`,
      returnId: returnRequest.id,
      inspector: randomChoice(['陈验收', '李主管', '王专员']),
      inspectionResult: passed ? 'passed' : 'failed',
      damageLevel: passed ? 'none' : randomChoice(['minor', 'moderate', 'severe'] as const),
      damageDescription: passed ? '商品外观完好，配件齐全，功能正常' : randomChoice([
        '商品外包装有明显压痕，内物屏幕碎裂',
        '商品外壳有划痕，疑似已使用过',
        '缺少配件：充电器、说明书',
        '商品进水，主板腐蚀损坏',
      ]),
      damageImages: passed ? [] : Array.from({ length: randomInt(2, 4) }, (_, j) => `/images/damage/${i}_${j + 1}.jpg`),
      receivedQuantity: 1,
      inspectedAt: createdAt.add(randomInt(2, 5), 'day').add(randomInt(0, 8), 'hour').format('YYYY-MM-DD HH:mm:ss'),
    })
  }

  if (['refunding', 'refund_completed', 'completed'].includes(status)) {
    const originalPaymentMethod: PaymentMethod = randomChoice(['alipay', 'wechat', 'bank', 'points'])
    refundRecords.push({
      id: `RR${pad(20260000 + i, 8)}`,
      returnId: returnRequest.id,
      orderId: returnRequest.orderId,
      originalPaymentMethod,
      refundMethod: originalPaymentMethod === 'points' ? 'points' : randomChoice<RefundMethod>(['original', 'original', 'original', 'points']),
      refundAmount,
      pointsAmount: originalPaymentMethod === 'points' || randomChoice([false, false, false, true]) ? Math.floor(refundAmount * 100) : 0,
      status: status === 'refunding' ? randomChoice<'pending' | 'processing' | 'success' | 'failed'>(['processing', 'pending']) : status === 'refund_completed' ? 'success' : randomChoice(['success', 'success', 'success', 'failed']),
      transactionId: `TXN${Date.now()}${pad(i, 4)}`,
      processedAt: createdAt.add(randomInt(3, 6), 'day').add(randomInt(0, 23), 'hour').format('YYYY-MM-DD HH:mm:ss'),
    })
  }

  if (status === 'inspection_failed' || status === 'ticket_created') {
    const priorities: LiabilityTicket['priority'][] = ['low', 'medium', 'high', 'urgent']
    liabilityTickets.push({
      id: `TK${pad(20260000 + i, 8)}`,
      returnId: returnRequest.id,
      orderId: returnRequest.orderId,
      assignee: randomChoice(['赵客服', '王专员', '孙调度']),
      liabilityParty: randomChoice(['customer', 'merchant', 'logistics', 'unknown'] as const),
      status: status === 'ticket_created' ? randomChoice(['pending', 'processing'] as const) : randomChoice(['resolved', 'closed'] as const),
      priority: priorities[idx % priorities.length],
      description: `客户投诉商品${randomChoice(['损坏', '与描述不符', '功能异常', '缺失配件'])}，需判定责任方`,
      resolution: status === 'ticket_created' ? '' : randomChoice([
        '判定为物流责任，已协调物流赔付客户',
        '判定为商家发货问题，已重新发货',
        '判定为客户使用不当，已沟通解释关闭工单',
        '多方协商未果，提交上级处理',
      ]),
      createdAt: createdAt.add(randomInt(4, 6), 'day').format('YYYY-MM-DD HH:mm:ss'),
      resolvedAt: status === 'ticket_created' ? '' : createdAt.add(randomInt(6, 10), 'day').format('YYYY-MM-DD HH:mm:ss'),
    })
  }
}

const alertTypes: Alert['type'][] = ['inspection_timeout', 'refund_failed', 'logistics_exception', 'ticket_overdue']
const alertSeverities: Alert['severity'][] = ['info', 'warning', 'error', 'critical']
const alertTitles: Record<Alert['type'], string> = {
  inspection_timeout: '验收超时提醒',
  refund_failed: '退款处理失败',
  logistics_exception: '物流异常告警',
  ticket_overdue: '工单即将超时',
}
for (let i = 1; i <= 25; i++) {
  const type = alertTypes[(i - 1) % alertTypes.length]
  const severity = alertSeverities[(i - 1) % alertSeverities.length]
  const relatedReturn = returnRequests[(i * 3) % returnRequests.length]
  alerts.push({
    id: `AL${pad(20260000 + i, 8)}`,
    type,
    severity,
    title: alertTitles[type],
    description: type === 'inspection_timeout' ? `退货单${relatedReturn.id}超过24小时未完成验收` :
                 type === 'refund_failed' ? `退款单RR${pad(20260000 + i, 8)}处理失败，请检查支付通道` :
                 type === 'logistics_exception' ? `物流单号异常，请及时跟进` :
                 `工单TK${pad(20260000 + i, 8)}距离截止时间不足2小时`,
    relatedId: relatedReturn.id,
    status: (i % 3 === 0) ? 'resolved' : (i % 3 === 1 ? 'unread' : 'read'),
    createdAt: dayjs('2026-06-01').add(Math.floor((i - 1) / 2), 'day').add(randomInt(0, 23), 'hour').add(randomInt(0, 59), 'minute').format('YYYY-MM-DD HH:mm:ss'),
  })
}

const logActions = ['创建退货单', '审核退货方案', '审批通过', '审批驳回', '生成物流单', '指派快递', '登记取件', '仓库收货', '完成验收', '发起退款', '退款成功', '创建工单', '分配工单', '关闭工单', '更新系统配置', '新增用户', '修改规则']
const logModules = ['退货管理', '审批管理', '物流管理', '仓库管理', '退款管理', '工单管理', '系统设置']
for (let i = 1; i <= 80; i++) {
  const action = randomChoice(logActions)
  let targetId = ''
  if (action.includes('退货') || action.includes('退款')) {
    targetId = returnRequests[i % returnRequests.length].id
  } else if (action.includes('物流')) {
    targetId = logisticsOrders[i % Math.max(logisticsOrders.length, 1)].id || 'LO20260001'
  } else if (action.includes('工单')) {
    targetId = liabilityTickets[i % Math.max(liabilityTickets.length, 1)].id || 'TK20260001'
  } else {
    targetId = `SYS${pad(i, 6)}`
  }
  operationLogs.push({
    id: `LOG${pad(202600000 + i, 9)}`,
    operator: randomChoice(OPERATORS),
    action,
    module: randomChoice(logModules),
    targetId,
    detail: `${action}操作，操作单号：${targetId}`,
    ip: generateIp(),
    createdAt: dayjs('2026-06-01').add(Math.floor((i - 1) / 5), 'day').add(randomInt(0, 23), 'hour').add(randomInt(0, 59), 'minute').add(randomInt(0, 59), 'second').format('YYYY-MM-DD HH:mm:ss'),
  })
}

const reports: ReportData[] = []
for (let i = 29; i >= 0; i--) {
  const date = dayjs('2026-06-16').subtract(i, 'day')
  const dayReturns = randomInt(30, 80)
  const reasonDist = RETURN_REASONS.map(r => ({ reason: r, count: randomInt(2, Math.floor(dayReturns / 2)) }))
  const categoryDist = PRODUCT_CATEGORIES.map(c => ({ category: c, rate: randomFloat(0.01, 0.15) }))
  reports.push({
    date: date.format('YYYY-MM-DD'),
    totalReturns: dayReturns,
    returnRate: randomFloat(0.03, 0.08),
    approvedRate: randomFloat(0.75, 0.95),
    averageProcessingHours: randomFloat(12, 48),
    refundTotalAmount: randomFloat(15000, 80000),
    logisticsTotalCost: randomFloat(800, 3500),
    reasonDistribution: reasonDist,
    categoryReturnRate: categoryDist,
  })
}

export const mockData = {
  returnRequests,
  couriers,
  logisticsOrders,
  inspectionRecords,
  refundRecords,
  liabilityTickets,
  alerts,
  operationLogs,
  reports,
}

export const dataCounts = {
  returnRequests: returnRequests.length,
  couriers: couriers.length,
  logisticsOrders: logisticsOrders.length,
  inspectionRecords: inspectionRecords.length,
  refundRecords: refundRecords.length,
  liabilityTickets: liabilityTickets.length,
  alerts: alerts.length,
  operationLogs: operationLogs.length,
  reports: reports.length,
}

export default mockData
