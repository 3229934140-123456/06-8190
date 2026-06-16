import { useState, useEffect } from 'react'
import {
  Truck,
  Search,
  Plus,
  Eye,
  Calendar,
  Package,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MapPin,
  User,
} from 'lucide-react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/ui/StatusBadge'
import KPICard from '@/components/ui/KPICard'
import Timeline, { TimelineItem } from '@/components/ui/Timeline'
import Skeleton from '@/components/ui/Skeleton'
import { useLogisticsStore } from '@/store/logistics'
import { useReturnsStore } from '@/store/returns'
import { LOGISTICS_STATUS_LABEL, RETURN_STATUS_LABEL } from '@/types'
import type { LogisticsOrder, LogisticsStatus } from '@/types'
import { selectBestCourier, DEFAULT_COURIERS } from '@/services/engine/logisticsEngine'
import type { DispatchResult } from '@/services/engine/logisticsEngine'
import { cn } from '@/lib/utils'

const getLogisticsStatusType = (status: LogisticsStatus): 'pending' | 'shipping' | 'delivered' | 'error' | 'info' => {
  switch (status) {
    case 'created':
      return 'pending'
    case 'picked':
      return 'shipping'
    case 'in_transit':
      return 'shipping'
    case 'delivered':
      return 'delivered'
    case 'exception':
      return 'error'
    default:
      return 'info'
  }
}

export default function Logistics() {
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<LogisticsOrder | null>(null)
  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null)
  const [courierId, setCourierId] = useState('')
  const [selectedReturnId, setSelectedReturnId] = useState('')
  const [filterCourierId, setFilterCourierId] = useState('')
  const [filterStatus, setFilterStatus] = useState<LogisticsStatus | ''>('')
  const [filterDateStart, setFilterDateStart] = useState('')
  const [filterDateEnd, setFilterDateEnd] = useState('')

  const {
    orders,
    couriers,
    loading,
    fetchOrders,
    fetchCouriers,
    fetchOrderDetail,
    orderDetail,
    setFilters,
    createOrder,
  } = useLogisticsStore()

  const { list: returnRequests, fetchList: fetchReturns } = useReturnsStore()

  useEffect(() => {
    fetchOrders()
    fetchCouriers()
    fetchReturns()
  }, [fetchOrders, fetchCouriers, fetchReturns])

  useEffect(() => {
    if (selectedOrder) {
      fetchOrderDetail(selectedOrder.id)
    }
  }, [selectedOrder, fetchOrderDetail])

  const applyFilters = () => {
    setFilters({
      courierId: filterCourierId || undefined,
      status: filterStatus || undefined,
      dateRange:
        filterDateStart && filterDateEnd ? [filterDateStart, filterDateEnd] : undefined,
    })
  }

  const resetFilters = () => {
    setFilterCourierId('')
    setFilterStatus('')
    setFilterDateStart('')
    setFilterDateEnd('')
    setFilters({})
  }

  const openDetail = (order: LogisticsOrder) => {
    setSelectedOrder(order)
    setDetailModalOpen(true)
  }

  const openCreateModal = () => {
    setSelectedReturnId('')
    setDispatchResult(null)
    setCourierId('')
    setCreateModalOpen(true)
  }

  const handleDispatch = () => {
    if (!selectedReturnId) return
    const returnReq = returnRequests.find((r) => r.id === selectedReturnId)
    if (!returnReq) return

    const result = selectBestCourier(
      {
        weight: 1,
        declaredValue: returnReq.productPrice,
        fragile: false,
        category: returnReq.productCategory,
      },
      {
        priority: 'balanced',
        requireInsurance: returnReq.productPrice > 1000,
        requirePickup: true,
      },
      {
        province: '北京市',
        city: '北京市',
        district: '朝阳区',
        detail: '示例地址',
        contactName: returnReq.customerName,
        contactPhone: '13800138000',
      },
      {
        province: '上海市',
        city: '上海市',
        district: '浦东新区',
        detail: '张江高科技园区博云路2号',
        contactName: '仓库收',
        contactPhone: '021-88889999',
      },
      (couriers.length > 0 ? (couriers as any) : DEFAULT_COURIERS)
    )
    setDispatchResult(result)
    setCourierId(result.bestCourier.id)
  }

  const handleCreateOrder = async () => {
    if (!selectedReturnId || !courierId) return
    await createOrder(selectedReturnId, courierId)
    setCreateModalOpen(false)
    setSelectedReturnId('')
    setDispatchResult(null)
    setCourierId('')
  }

  const generateTimeline = (order: LogisticsOrder): TimelineItem[] => {
    const items: TimelineItem[] = []
    items.push({
      id: 1,
      title: '物流单已创建',
      description: `快递：${order.courierName}，运单号：${order.trackingNumber}`,
      time: order.createdAt,
      status: 'completed',
    })
    if (order.status === 'picked' || order.status === 'in_transit' || order.status === 'delivered' || order.status === 'exception') {
      items.push({
        id: 2,
        title: '快递已取件',
        description: '快递员已上门取件',
        status: 'completed',
      })
    }
    if (order.status === 'in_transit' || order.status === 'delivered') {
      items.push({
        id: 3,
        title: '运输中',
        description: '包裹正在运输途中',
        status: order.status === 'in_transit' ? 'current' : 'completed',
      })
    }
    if (order.status === 'delivered') {
      items.push({
        id: 4,
        title: '已送达',
        description: '包裹已送达仓库',
        status: 'completed',
      })
    }
    if (order.status === 'exception') {
      items.push({
        id: 5,
        title: '物流异常',
        description: '物流出现异常，请联系快递处理',
        status: 'current',
      })
    }
    return items
  }

  const columns: Column<LogisticsOrder>[] = [
    {
      key: 'id',
      title: '物流单号',
      width: '150px',
      render: (row) => (
        <span className="font-mono text-sm text-slate-200">{row.id}</span>
      ),
    },
    {
      key: 'returnId',
      title: '退货单',
      width: '150px',
      render: (row) => (
        <span className="font-mono text-sm text-primary-400">{row.returnId}</span>
      ),
    },
    {
      key: 'courierName',
      title: '快递公司',
      width: '120px',
      render: (row) => <span className="text-sm text-white">{row.courierName}</span>,
    },
    {
      key: 'trackingNumber',
      title: '运单号',
      width: '160px',
      render: (row) => (
        <span className="font-mono text-sm text-slate-300">{row.trackingNumber}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '100px',
      align: 'center',
      render: (row) => (
        <StatusBadge status={getLogisticsStatusType(row.status)}>
          {LOGISTICS_STATUS_LABEL[row.status]}
        </StatusBadge>
      ),
    },
    {
      key: 'estimatedDays',
      title: '预计天数',
      width: '100px',
      align: 'center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1 text-sm text-slate-300">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          {row.estimatedDays} 天
        </div>
      ),
    },
    {
      key: 'estimatedCost',
      title: '费用',
      width: '100px',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1 text-sm">
          <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          <span className="font-semibold text-emerald-400">
            ¥{row.estimatedCost.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '100px',
      align: 'center',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            openDetail(row)
          }}
          className={cn(
            'inline-flex items-center gap-1 rounded-lg border border-primary-500/30',
            'bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-400',
            'transition-all duration-200 hover:border-primary-500/50 hover:bg-primary-500/20 hover:text-primary-300'
          )}
        >
          <Eye className="h-3.5 w-3.5" />
          详情
        </button>
      ),
    },
  ]

  const availableReturns = returnRequests.filter(
    (r) => r.status === 'approved'
  )

  if (loading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <KPICard
          title="物流单总数"
          value={orders.length}
          icon={Package}
          gradient="blue"
        />
        <KPICard
          title="运输中"
          value={orders.filter((o) => o.status === 'in_transit').length}
          icon={Truck}
          gradient="cyan"
        />
        <KPICard
          title="已送达"
          value={orders.filter((o) => o.status === 'delivered').length}
          icon={CheckCircle2}
          gradient="emerald"
        />
        <KPICard
          title="异常"
          value={orders.filter((o) => o.status === 'exception').length}
          icon={AlertCircle}
          gradient="orange"
        />
      </div>

      <div className="glass-card">
        <div className="flex flex-col gap-4 border-b border-dark-700 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <select
                value={filterCourierId}
                onChange={(e) => setFilterCourierId(e.target.value)}
                className={cn(
                  'h-9 w-40 appearance-none rounded-lg border border-dark-600 bg-dark-800 pl-3 pr-8 text-sm',
                  'text-white outline-none transition-all duration-200',
                  'focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20'
                )}
              >
                <option value="">全部快递</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as LogisticsStatus | '')}
                className={cn(
                  'h-9 w-36 appearance-none rounded-lg border border-dark-600 bg-dark-800 pl-3 pr-8 text-sm',
                  'text-white outline-none transition-all duration-200',
                  'focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20'
                )}
              >
                <option value="">全部状态</option>
                <option value="created">已创建</option>
                <option value="picked">已取件</option>
                <option value="in_transit">运输中</option>
                <option value="delivered">已送达</option>
                <option value="exception">异常</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  value={filterDateStart}
                  onChange={(e) => setFilterDateStart(e.target.value)}
                  className={cn(
                    'h-9 w-40 rounded-lg border border-dark-600 bg-dark-800 pl-9 pr-3 text-sm',
                    'text-white outline-none transition-all duration-200',
                    'focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20'
                  )}
                />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="date"
                  value={filterDateEnd}
                  onChange={(e) => setFilterDateEnd(e.target.value)}
                  className={cn(
                    'h-9 w-40 rounded-lg border border-dark-600 bg-dark-800 pl-9 pr-3 text-sm',
                    'text-white outline-none transition-all duration-200',
                    'focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20'
                  )}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className={cn(
                'h-9 rounded-lg border border-dark-600 bg-dark-700 px-4 text-sm font-medium',
                'text-slate-300 transition-all duration-200 hover:bg-dark-600 hover:text-white'
              )}
            >
              重置
            </button>
            <button
              onClick={applyFilters}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-600 px-4 text-sm font-medium text-white',
                'transition-all duration-200 hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/30'
              )}
            >
              <Search className="h-4 w-4" />
              查询
            </button>
            <button
              onClick={openCreateModal}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white',
                'transition-all duration-200 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30'
              )}
            >
              <Plus className="h-4 w-4" />
              生成物流单
            </button>
          </div>
        </div>

        <div className="p-4">
          <DataTable
            columns={columns}
            data={orders as any}
            pageSize={10}
            rowKey="id"
            emptyTitle="暂无物流单"
            emptyDescription="还没有创建物流单记录"
          />
        </div>
      </div>

      <Modal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false)
          setSelectedOrder(null)
        }}
        title="物流详情"
        size="lg"
        footer={
          <button
            onClick={() => {
              setDetailModalOpen(false)
              setSelectedOrder(null)
            }}
            className={cn(
              'rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white',
              'transition-all duration-200 hover:bg-primary-500'
            )}
          >
            关闭
          </button>
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
                <p className="text-xs text-slate-500">物流单号</p>
                <p className="mt-1 font-mono text-sm text-white">{selectedOrder.id}</p>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
                <p className="text-xs text-slate-500">运单号</p>
                <p className="mt-1 font-mono text-sm text-white">
                  {selectedOrder.trackingNumber}
                </p>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
                <p className="text-xs text-slate-500">快递公司</p>
                <p className="mt-1 text-sm text-white">{selectedOrder.courierName}</p>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
                <p className="text-xs text-slate-500">状态</p>
                <div className="mt-1">
                  <StatusBadge status={getLogisticsStatusType(selectedOrder.status)}>
                    {LOGISTICS_STATUS_LABEL[selectedOrder.status]}
                  </StatusBadge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-medium text-white">取件地址</p>
                </div>
                <div className="space-y-1 text-sm text-slate-300">
                  <p>{(selectedOrder.pickupAddress as any).contact || (selectedOrder.pickupAddress as any).contactName}</p>
                  <p>{(selectedOrder.pickupAddress as any).phone || (selectedOrder.pickupAddress as any).contactPhone}</p>
                  <p>
                    {selectedOrder.pickupAddress.province}
                    {selectedOrder.pickupAddress.city}
                    {selectedOrder.pickupAddress.district}
                    {selectedOrder.pickupAddress.detail}
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <p className="text-sm font-medium text-white">退货地址</p>
                </div>
                <div className="space-y-1 text-sm text-slate-300">
                  <p>{(selectedOrder.returnAddress as any).contact || (selectedOrder.returnAddress as any).contactName}</p>
                  <p>{(selectedOrder.returnAddress as any).phone || (selectedOrder.returnAddress as any).contactPhone}</p>
                  <p>
                    {selectedOrder.returnAddress.province}
                    {selectedOrder.returnAddress.city}
                    {selectedOrder.returnAddress.district}
                    {selectedOrder.returnAddress.detail}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-white">物流跟踪</p>
              <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
                <Timeline items={generateTimeline(selectedOrder)} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          setSelectedReturnId('')
          setDispatchResult(null)
          setCourierId('')
        }}
        title="生成物流单"
        size="xl"
        footer={
          <>
            <button
              onClick={() => {
                setCreateModalOpen(false)
                setSelectedReturnId('')
                setDispatchResult(null)
                setCourierId('')
              }}
              className={cn(
                'rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-sm font-medium',
                'text-slate-300 transition-all duration-200 hover:bg-dark-600 hover:text-white'
              )}
            >
              取消
            </button>
            <button
              onClick={handleCreateOrder}
              disabled={!dispatchResult || !courierId}
              className={cn(
                'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white',
                'transition-all duration-200 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none'
              )}
            >
              确认创建
            </button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              选择退货单
            </label>
            <select
              value={selectedReturnId}
              onChange={(e) => setSelectedReturnId(e.target.value)}
              className={cn(
                'h-10 w-full appearance-none rounded-lg border border-dark-600 bg-dark-800 px-3 text-sm',
                'text-white outline-none transition-all duration-200',
                'focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20'
              )}
            >
              <option value="">请选择需要创建物流单的退货单</option>
              {availableReturns.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.id} - {r.productName} - ¥{r.refundAmount}
                </option>
              ))}
            </select>
            {availableReturns.length === 0 && (
              <p className="mt-2 text-xs text-slate-500">暂无可创建物流单的退货申请</p>
            )}
          </div>

          {selectedReturnId && (
            <button
              onClick={handleDispatch}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-lg bg-primary-600 px-5 text-sm font-medium text-white',
                'transition-all duration-200 hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/30'
              )}
            >
              <Truck className="h-4 w-4" />
              智能派单（选择最优快递）
            </button>
          )}

          {dispatchResult && (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-400">推荐快递</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {dispatchResult.bestCourier.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400">综合评分</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      {dispatchResult.bestCourier.finalScore}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-500">预计天数</p>
                    <p className="mt-0.5 text-white">
                      {dispatchResult.bestCourier.estimatedDays} 天
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">预计费用</p>
                    <p className="mt-0.5 text-emerald-400">
                      ¥{dispatchResult.bestCourier.totalCost.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">保价费</p>
                    <p className="mt-0.5 text-white">
                      ¥{dispatchResult.bestCourier.insuranceCost.toFixed(2)}
                    </p>
                  </div>
                </div>
                {dispatchResult.bestCourier.matchReasons.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500">推荐理由</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {dispatchResult.bestCourier.matchReasons.map((reason, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-300">候选快递对比</p>
                <div className="space-y-2">
                  {dispatchResult.candidates
                    .filter((c) => c.eligible)
                    .slice(0, 3)
                    .map((c) => (
                      <label
                        key={c.id}
                        className={cn(
                          'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all duration-200',
                          courierId === c.id
                            ? 'border-primary-500/50 bg-primary-500/10'
                            : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="courier"
                            value={c.id}
                            checked={courierId === c.id}
                            onChange={(e) => setCourierId(e.target.value)}
                            className="h-4 w-4 accent-primary-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{c.name}</p>
                            <p className="text-xs text-slate-500">
                              预计 {c.estimatedDays} 天 · ¥{c.totalCost.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary-400">
                            {c.finalScore}
                          </p>
                          <p className="text-xs text-slate-500">评分</p>
                        </div>
                      </label>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
