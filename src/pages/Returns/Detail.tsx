import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Package,
  User,
  Calendar,
  MapPin,
  Truck,
  CheckCircle2,
  XCircle,
  Wallet,
  Clock,
  FileText,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Timeline, { type TimelineItem } from '@/components/ui/Timeline'
import Skeleton from '@/components/ui/Skeleton'
import Modal from '@/components/ui/Modal'
import { useReturnsStore } from '@/store/returns'
import { useUserStore } from '@/store/user'
import { dataService } from '@/services/dataService'
import {
  RETURN_STATUS_LABEL,
  RETURN_STATUS_COLOR,
  CUSTOMER_LEVEL_LABEL,
  RETURN_TYPE_LABEL,
  LOGISTICS_STATUS_LABEL,
  LOGISTICS_STATUS_COLOR,
  INSPECTION_RESULT_LABEL,
  DAMAGE_LEVEL_LABEL,
  REFUND_STATUS_LABEL,
  REFUND_STATUS_COLOR,
  PAYMENT_METHOD_LABEL,
  REFUND_METHOD_LABEL,
  type ReturnStatus,
} from '@/types'
import { cn } from '@/lib/utils'

const STATUS_TO_BADGE: Record<ReturnStatus, 'pending' | 'processing' | 'approved' | 'rejected' | 'shipping' | 'delivered' | 'success' | 'error' | 'refunded' | 'warning' | 'completed'> = {
  pending_review: 'pending',
  reviewing: 'processing',
  approved: 'approved',
  rejected: 'rejected',
  logistics_created: 'shipping',
  picked_up: 'shipping',
  in_transit: 'shipping',
  warehouse_received: 'delivered',
  inspecting: 'processing',
  inspection_passed: 'success',
  inspection_failed: 'error',
  refunding: 'processing',
  refund_completed: 'refunded',
  ticket_created: 'warning',
  completed: 'completed',
}

export default function ReturnsDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { detail, loading, fetchDetail, clearDetail, approve, updateStatus, inspect } = useReturnsStore()
  const { hasPermission } = useUserStore()
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showInspectModal, setShowInspectModal] = useState(false)
  const [inspectResult, setInspectResult] = useState<'passed' | 'failed'>('passed')
  const [damageLevel, setDamageLevel] = useState<'none' | 'minor' | 'moderate' | 'severe'>('none')
  const [damageDescription, setDamageDescription] = useState('')
  const [remark, setRemark] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [logistics, setLogistics] = useState<ReturnType<typeof dataService.getLogisticsOrderByReturnId>>(undefined)
  const [inspection, setInspection] = useState<ReturnType<typeof dataService.getInspectionRecordByReturnId>>(undefined)
  const [refund, setRefund] = useState<ReturnType<typeof dataService.getRefundRecordByReturnId>>(undefined)

  const loadRelatedData = () => {
    if (id) {
      setLogistics(dataService.getLogisticsOrderByReturnId(id))
      setInspection(dataService.getInspectionRecordByReturnId(id))
      setRefund(dataService.getRefundRecordByReturnId(id))
    }
  }

  useEffect(() => {
    if (id) {
      fetchDetail(id)
      loadRelatedData()
    }
    return () => {
      clearDetail()
    }
  }, [id, fetchDetail, clearDetail])

  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      loadRelatedData()
    })
    return unsubscribe
  }, [id])

  const timelineItems: TimelineItem[] = (detail?.timeline || []).map((event, index) => ({
    id: index,
    title: RETURN_STATUS_LABEL[event.status],
    description: event.remark,
    time: event.timestamp,
    user: event.operator,
    status: index === (detail?.timeline.length || 1) - 1 ? 'current' : 'completed',
  }))

  const handleApprove = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await approve(id, remark || undefined)
      await fetchDetail(id)
      setShowApproveModal(false)
      setRemark('')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!id || !rejectReason) return
    setActionLoading(true)
    try {
      await updateStatus(id, 'rejected', rejectReason)
      await fetchDetail(id)
      setShowRejectModal(false)
      setRejectReason('')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCreateLogistics = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await updateStatus(id, 'logistics_created', '已生成物流单，等待取件')
      await fetchDetail(id)
    } finally {
      setActionLoading(false)
    }
  }

  const handleReceive = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await updateStatus(id, 'warehouse_received', '仓库已签收商品')
      await fetchDetail(id)
    } finally {
      setActionLoading(false)
    }
  }

  const handleInspect = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await updateStatus(id, 'inspecting', '开始商品验收')
      await fetchDetail(id)
      setShowInspectModal(true)
      setInspectResult('passed')
      setDamageLevel('none')
      setDamageDescription('')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmitInspection = async () => {
    if (!id || (inspectResult === 'failed' && !damageDescription.trim())) return
    setActionLoading(true)
    try {
      await inspect(
        id,
        inspectResult,
        inspectResult === 'passed' ? 'none' : damageLevel,
        damageDescription || '商品完好无损'
      )
      await fetchDetail(id)
      setShowInspectModal(false)
      setDamageDescription('')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async () => {
    if (!id) return
    setActionLoading(true)
    try {
      await updateStatus(id, 'completed', '退货流程已完成')
      await fetchDetail(id)
    } finally {
      setActionLoading(false)
    }
  }

  const canApprove = detail?.status === 'pending_review' || detail?.status === 'reviewing'
  const canReceive = detail?.status === 'in_transit' || detail?.status === 'picked_up'
  const canInspect = detail?.status === 'warehouse_received' || detail?.status === 'inspecting'
  const canComplete = detail?.status === 'refund_completed'

  if (loading && !detail) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-slate-600 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">退货单不存在</h3>
        <p className="text-sm text-slate-400 mb-6">未找到对应的退货申请记录</p>
        <button
          onClick={() => navigate('/returns')}
          className="flex items-center gap-2 rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/returns')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark-700 bg-dark-800 text-slate-400 hover:bg-dark-700 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">退货详情</h1>
              <StatusBadge status={STATUS_TO_BADGE[detail.status]}>
                {RETURN_STATUS_LABEL[detail.status]}
              </StatusBadge>
            </div>
            <p className="mt-0.5 text-sm text-slate-400">
              单号：<span className="font-mono text-slate-300">{detail.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canApprove && hasPermission('returns:approve') && (
            <>
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                驳回
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                <CheckCircle2 className="h-4 w-4" />
                审批通过
              </button>
            </>
          )}
          {canReceive && hasPermission('warehouse:view') && (
            <button
              onClick={handleReceive}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors disabled:opacity-50"
            >
              <Package className="h-4 w-4" />
              {actionLoading ? '处理中...' : '确认收货'}
            </button>
          )}
          {canInspect && hasPermission('warehouse:inspect') && (
            <button
              onClick={handleInspect}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {actionLoading ? '处理中...' : '开始验收'}
            </button>
          )}
          {canComplete && (
            <button
              onClick={handleComplete}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {actionLoading ? '处理中...' : '完成'}
            </button>
          )}
          <button
            onClick={() => id && fetchDetail(id)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark-700 bg-dark-800 text-slate-400 hover:bg-dark-700 hover:text-white transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="glass-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
              <FileText className="h-5 w-5 text-primary-400" />
              基本信息
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500 mb-1">退货单号</p>
                <p className="font-mono text-sm text-white">{detail.id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">关联订单号</p>
                <p className="font-mono text-sm text-white">{detail.orderId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">商品名称</p>
                <p className="text-sm text-white">{detail.productName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">商品分类</p>
                <p className="text-sm text-white">{detail.productCategory}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">商品原价</p>
                <p className="text-sm text-white">¥{detail.productPrice.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">退货类型</p>
                <p className="text-sm text-white">{RETURN_TYPE_LABEL[detail.returnType]}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">退货原因</p>
                <p className="text-sm text-white">{detail.returnReason}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">保修状态</p>
                <div className="flex items-center gap-2">
                  {detail.inWarranty ? (
                    <StatusBadge status="success" showDot={false}>保修期内</StatusBadge>
                  ) : (
                    <StatusBadge status="warning" showDot={false}>已过保</StatusBadge>
                  )}
                  <span className="text-xs text-slate-500">至 {detail.warrantyExpireDate}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">申请时间</p>
                <div className="flex items-center gap-1.5 text-sm text-white">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  {detail.createdAt}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">更新时间</p>
                <div className="flex items-center gap-1.5 text-sm text-white">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  {detail.updatedAt}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
              <User className="h-5 w-5 text-primary-400" />
              客户信息
            </h3>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">客户姓名</p>
                <p className="text-sm text-white">{detail.customerName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">客户ID</p>
                <p className="font-mono text-sm text-white">{detail.customerId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">客户等级</p>
                <p className="text-sm text-white">{CUSTOMER_LEVEL_LABEL[detail.customerLevel]}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
              <Wallet className="h-5 w-5 text-primary-400" />
              退货方案 / 退款明细
            </h3>
            <div className="rounded-lg bg-dark-800/60 p-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">商品原价</p>
                  <p className="text-lg font-semibold text-white">¥{detail.productPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">折旧率</p>
                  <p className="text-lg font-semibold text-orange-400">
                    {(detail.depreciationRate * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">折旧金额</p>
                  <p className="text-lg font-semibold text-orange-400">-¥{detail.depreciationAmount.toFixed(2)}</p>
                </div>
              </div>
              <div className="my-4 border-t border-dark-700" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">应退金额</span>
                <span className="text-2xl font-bold text-emerald-400">¥{detail.refundAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {logistics && (
            <div className="glass-card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                <Truck className="h-5 w-5 text-primary-400" />
                物流信息
              </h3>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">物流公司</p>
                  <p className="text-sm text-white">{logistics.courierName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">物流单号</p>
                  <p className="font-mono text-sm text-white">{logistics.trackingNumber}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">物流状态</p>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${LOGISTICS_STATUS_COLOR[logistics.status]}20`,
                      color: LOGISTICS_STATUS_COLOR[logistics.status],
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: LOGISTICS_STATUS_COLOR[logistics.status] }}
                    />
                    {LOGISTICS_STATUS_LABEL[logistics.status]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">预计/实际天数</p>
                  <p className="text-sm text-white">
                    {logistics.estimatedDays}天 / {logistics.actualDays ? `${logistics.actualDays}天` : '--'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">预计/实际费用</p>
                  <p className="text-sm text-white">
                    ¥{logistics.estimatedCost.toFixed(2)} / {logistics.actualCost ? `¥${logistics.actualCost.toFixed(2)}` : '--'}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 mb-1">取件地址</p>
                  <div className="flex items-start gap-1.5 text-sm text-white">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>
                      {logistics.pickupAddress.province}{logistics.pickupAddress.city}
                      {logistics.pickupAddress.district}{logistics.pickupAddress.detail}
                      （{logistics.pickupAddress.contactName} {logistics.pickupAddress.contactPhone}）
                    </span>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 mb-1">退货地址</p>
                  <div className="flex items-start gap-1.5 text-sm text-white">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>
                      {logistics.returnAddress.province}{logistics.returnAddress.city}
                      {logistics.returnAddress.district}{logistics.returnAddress.detail}
                      （{logistics.returnAddress.contactName} {logistics.returnAddress.contactPhone}）
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {inspection && (
            <div className="glass-card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                <ShieldCheck className="h-5 w-5 text-primary-400" />
                验收信息
              </h3>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">验收结果</p>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
                      inspection.inspectionResult === 'passed'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 rounded-full animate-pulse',
                        inspection.inspectionResult === 'passed' ? 'bg-emerald-400' : 'bg-red-400'
                      )}
                    />
                    {INSPECTION_RESULT_LABEL[inspection.inspectionResult]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">损坏程度</p>
                  <p className="text-sm text-white">{DAMAGE_LEVEL_LABEL[inspection.damageLevel]}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">验收人</p>
                  <p className="text-sm text-white">{inspection.inspector}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">验收时间</p>
                  <p className="text-sm text-white">{inspection.inspectedAt}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">实收数量</p>
                  <p className="text-sm text-white">{inspection.receivedQuantity} 件</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500 mb-1">损坏描述</p>
                  <p className="text-sm text-white">{inspection.damageDescription}</p>
                </div>
                {inspection.damageImages.length > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-slate-500 mb-2">损坏照片</p>
                    <div className="flex gap-2 flex-wrap">
                      {inspection.damageImages.map((img, idx) => (
                        <div
                          key={idx}
                          className="h-20 w-20 rounded-lg bg-dark-700 flex items-center justify-center text-xs text-slate-500 border border-dark-600"
                        >
                          图片 {idx + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {refund && (
            <div className="glass-card p-5">
              <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
                <Wallet className="h-5 w-5 text-primary-400" />
                退款信息
              </h3>
              <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500 mb-1">退款单号</p>
                  <p className="font-mono text-sm text-white">{refund.id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">退款状态</p>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: `${REFUND_STATUS_COLOR[refund.status]}20`,
                      color: REFUND_STATUS_COLOR[refund.status],
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: REFUND_STATUS_COLOR[refund.status] }}
                    />
                    {REFUND_STATUS_LABEL[refund.status]}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">原支付方式</p>
                  <p className="text-sm text-white">{PAYMENT_METHOD_LABEL[refund.originalPaymentMethod]}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">退款方式</p>
                  <p className="text-sm text-white">{REFUND_METHOD_LABEL[refund.refundMethod]}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">退款金额</p>
                  <p className="text-lg font-semibold text-emerald-400">¥{refund.refundAmount.toFixed(2)}</p>
                </div>
                {refund.pointsAmount > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">积分补偿</p>
                    <p className="text-sm text-white">{refund.pointsAmount} 积分</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 mb-1">交易流水号</p>
                  <p className="font-mono text-sm text-white">{refund.transactionId}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">处理时间</p>
                  <p className="text-sm text-white">{refund.processedAt}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5 sticky top-0">
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold text-white">
              <Clock className="h-5 w-5 text-primary-400" />
              处理进度
            </h3>
            {timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                暂无处理记录
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showApproveModal}
        onClose={() => !actionLoading && setShowApproveModal(false)}
        title="审批通过"
        description="确认通过该退货申请？"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">审批备注（可选）</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              placeholder="请输入审批备注..."
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowApproveModal(false)}
              disabled={actionLoading}
              className="rounded-lg border border-dark-700 bg-dark-800 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-dark-700 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {actionLoading ? '处理中...' : '确认通过'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRejectModal}
        onClose={() => !actionLoading && setShowRejectModal(false)}
        title="驳回申请"
        description="请填写驳回原因"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">驳回原因</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="请详细说明驳回原因..."
              className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowRejectModal(false)}
              disabled={actionLoading}
              className="rounded-lg border border-dark-700 bg-dark-800 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-dark-700 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />
              {actionLoading ? '处理中...' : '确认驳回'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showInspectModal}
        onClose={() => !actionLoading && setShowInspectModal(false)}
        title="商品验收"
        description="请选择验收结果"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">验收结果</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="inspectResult"
                  value="passed"
                  checked={inspectResult === 'passed'}
                  onChange={() => {
                    setInspectResult('passed')
                    setDamageLevel('none')
                    setDamageDescription('')
                  }}
                  className="h-4 w-4 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm text-white">验收通过</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="inspectResult"
                  value="failed"
                  checked={inspectResult === 'failed'}
                  onChange={() => setInspectResult('failed')}
                  className="h-4 w-4 text-red-500 focus:ring-red-500"
                />
                <span className="text-sm text-white">验收不通过</span>
              </label>
            </div>
          </div>

          {inspectResult === 'failed' && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">损坏等级</label>
                <select
                  value={damageLevel}
                  onChange={(e) => setDamageLevel(e.target.value as any)}
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2.5 text-sm text-white focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  <option value="minor">轻微损坏</option>
                  <option value="moderate">中度损坏</option>
                  <option value="severe">严重损坏</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-300">损坏描述</label>
                <textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  rows={3}
                  placeholder="请详细描述损坏情况..."
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                />
              </div>
            </>
          )}

          {inspectResult === 'passed' && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4">
              <p className="text-sm text-emerald-400">
                <CheckCircle2 className="inline h-4 w-4 mr-1.5" />
                验收通过后将自动触发退款流程，预计1-3个工作日内退款将原路返回客户账户
              </p>
            </div>
          )}

          {inspectResult === 'failed' && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
              <p className="text-sm text-red-400">
                <AlertCircle className="inline h-4 w-4 mr-1.5" />
                验收不通过后将自动生成责任判定工单，分配客服人员跟进处理
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowInspectModal(false)}
              disabled={actionLoading}
              className="rounded-lg border border-dark-700 bg-dark-800 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-dark-700 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmitInspection}
              disabled={actionLoading || (inspectResult === 'failed' && !damageDescription.trim())}
              className={cn(
                "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50",
                inspectResult === 'passed' ? "bg-emerald-600 hover:bg-emerald-500" : "bg-red-600 hover:bg-red-500"
              )}
            >
              {inspectResult === 'passed' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {actionLoading ? '处理中...' : '确认提交'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
