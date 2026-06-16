import { useState, useEffect } from 'react'
import {
  PackageCheck,
  ClipboardList,
  Clock,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  User,
} from 'lucide-react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/ui/StatusBadge'
import KPICard from '@/components/ui/KPICard'
import Skeleton from '@/components/ui/Skeleton'
import { useReturnsStore } from '@/store/returns'
import {
  createInspectionRecord,
  getInspectionRecordByReturnId,
} from '@/services/api'
import {
  RETURN_STATUS_LABEL,
  DAMAGE_LEVEL_LABEL,
  INSPECTION_RESULT_LABEL,
} from '@/types'
import type {
  ReturnRequest,
  InspectionRecord,
  InspectionResult,
  DamageLevel,
} from '@/types'
import { cn } from '@/lib/utils'

type WarehouseTab = 'pending' | 'records'

export default function Warehouse() {
  const [activeTab, setActiveTab] = useState<WarehouseTab>('pending')
  const [inspectModalOpen, setInspectModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ReturnRequest | null>(null)
  const [inspectionResult, setInspectionResult] = useState<InspectionResult>('passed')
  const [damageLevel, setDamageLevel] = useState<DamageLevel>('none')
  const [damageDescription, setDamageDescription] = useState('')
  const [inspectionRecords, setInspectionRecords] = useState<InspectionRecord[]>([])
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { list, loading, fetchList, updateStatus } = useReturnsStore()

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    if (activeTab === 'records') {
      loadInspectionRecords()
    }
  }, [activeTab])

  const loadInspectionRecords = async () => {
    setLoadingRecords(true)
    const records: InspectionRecord[] = []
    for (const req of list) {
      const record = await getInspectionRecordByReturnId(req.id)
      if (record) {
        records.push(record)
      }
    }
    setInspectionRecords(records)
    setLoadingRecords(false)
  }

  const pendingList = list.filter((item) => item.status === 'warehouse_received')

  const openInspectModal = (item: ReturnRequest) => {
    setSelectedItem(item)
    setInspectionResult('passed')
    setDamageLevel('none')
    setDamageDescription('')
    setInspectModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!selectedItem) return
    setSubmitting(true)

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19)
    await createInspectionRecord({
      returnId: selectedItem.id,
      inspector: '当前用户',
      inspectionResult,
      damageLevel,
      damageDescription:
        inspectionResult === 'passed' ? '商品外观完好，配件齐全，功能正常' : damageDescription,
      damageImages: [],
      receivedQuantity: 1,
      inspectedAt: now,
    })

    await updateStatus(
      selectedItem.id,
      inspectionResult === 'passed' ? 'inspection_passed' : 'inspection_failed',
      inspectionResult === 'passed' ? '验收通过' : `验收不通过：${damageDescription}`
    )

    setSubmitting(false)
    setInspectModalOpen(false)
    setSelectedItem(null)
  }

  const pendingColumns: Column<ReturnRequest>[] = [
    {
      key: 'id',
      title: '退货单号',
      width: '150px',
      render: (row) => (
        <span className="font-mono text-sm text-slate-200">{row.id}</span>
      ),
    },
    {
      key: 'orderId',
      title: '订单号',
      width: '150px',
      render: (row) => (
        <span className="font-mono text-sm text-primary-400">{row.orderId}</span>
      ),
    },
    {
      key: 'productName',
      title: '商品',
      width: '220px',
      render: (row) => (
        <div>
          <p className="text-sm text-white">{row.productName}</p>
          <p className="mt-0.5 text-xs text-slate-500">{row.productCategory}</p>
        </div>
      ),
    },
    {
      key: 'customerName',
      title: '客户',
      width: '120px',
      render: (row) => <span className="text-sm text-white">{row.customerName}</span>,
    },
    {
      key: 'refundAmount',
      title: '退款金额',
      width: '120px',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-semibold text-emerald-400">
          ¥{row.refundAmount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'updatedAt',
      title: '到仓时间',
      width: '170px',
      sortable: true,
      render: (row) => <span className="text-sm text-slate-400">{row.updatedAt}</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: '120px',
      align: 'center',
      render: (row) => (
        <StatusBadge status="pending">
          {RETURN_STATUS_LABEL[row.status]}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      align: 'center',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            openInspectModal(row)
          }}
          className={cn(
            'inline-flex items-center gap-1 rounded-lg border border-primary-500/30',
            'bg-primary-500/10 px-3 py-1.5 text-xs font-medium text-primary-400',
            'transition-all duration-200 hover:border-primary-500/50 hover:bg-primary-500/20 hover:text-primary-300'
          )}
        >
          <PackageCheck className="h-3.5 w-3.5" />
          验收
        </button>
      ),
    },
  ]

  const recordColumns: Column<InspectionRecord>[] = [
    {
      key: 'id',
      title: '验收单号',
      width: '150px',
      render: (row) => (
        <span className="font-mono text-sm text-slate-200">{row.id}</span>
      ),
    },
    {
      key: 'returnId',
      title: '退货单号',
      width: '150px',
      render: (row) => (
        <span className="font-mono text-sm text-primary-400">{row.returnId}</span>
      ),
    },
    {
      key: 'inspector',
      title: '验收人',
      width: '120px',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-white">
          <User className="h-3.5 w-3.5 text-slate-500" />
          {row.inspector}
        </div>
      ),
    },
    {
      key: 'inspectionResult',
      title: '验收结果',
      width: '110px',
      align: 'center',
      render: (row) => (
        <StatusBadge status={row.inspectionResult === 'passed' ? 'approved' : 'rejected'}>
          {INSPECTION_RESULT_LABEL[row.inspectionResult]}
        </StatusBadge>
      ),
    },
    {
      key: 'damageLevel',
      title: '损坏等级',
      width: '110px',
      align: 'center',
      render: (row) => {
        if (row.damageLevel === 'none') {
          return <span className="text-sm text-slate-500">无损坏</span>
        }
        const levelColors: Record<DamageLevel, string> = {
          none: 'text-slate-500',
          minor: 'text-yellow-400',
          moderate: 'text-orange-400',
          severe: 'text-red-400',
        }
        return (
          <span className={cn('text-sm font-medium', levelColors[row.damageLevel])}>
            {DAMAGE_LEVEL_LABEL[row.damageLevel]}
          </span>
        )
      },
    },
    {
      key: 'damageDescription',
      title: '损坏描述',
      width: '250px',
      render: (row) => (
        <span className="text-sm text-slate-400">
          {row.damageDescription || '-'}
        </span>
      ),
    },
    {
      key: 'inspectedAt',
      title: '验收时间',
      width: '170px',
      sortable: true,
      render: (row) => <span className="text-sm text-slate-400">{row.inspectedAt}</span>,
    },
  ]

  if (loading && list.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KPICard
          title="待验收"
          value={pendingList.length}
          icon={Clock}
          gradient="orange"
          subtitle="已到仓库待验收商品"
        />
        <KPICard
          title="验收通过"
          value={inspectionRecords.filter((r) => r.inspectionResult === 'passed').length}
          icon={CheckCircle2}
          gradient="emerald"
          subtitle="验收通过的商品"
        />
        <KPICard
          title="验收不通过"
          value={inspectionRecords.filter((r) => r.inspectionResult === 'failed').length}
          icon={XCircle}
          gradient="orange"
          subtitle="验收不通过的商品"
        />
      </div>

      <div className="glass-card">
        <div className="flex items-center gap-1 border-b border-dark-700 px-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              'relative px-5 py-3.5 text-sm font-medium transition-all duration-200',
              activeTab === 'pending'
                ? 'text-primary-400'
                : 'text-slate-400 hover:text-slate-300'
            )}
          >
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              待验收
              {pendingList.length > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500/20 px-1.5 text-xs font-semibold text-orange-400">
                  {pendingList.length}
                </span>
              )}
            </span>
            {activeTab === 'pending' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('records')}
            className={cn(
              'relative px-5 py-3.5 text-sm font-medium transition-all duration-200',
              activeTab === 'records'
                ? 'text-primary-400'
                : 'text-slate-400 hover:text-slate-300'
            )}
          >
            <span className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              验收记录
            </span>
            {activeTab === 'records' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
        </div>

        <div className="p-4">
          {activeTab === 'pending' ? (
            <DataTable
              columns={pendingColumns}
              data={pendingList}
              pageSize={10}
              rowKey="id"
              emptyTitle="暂无待验收商品"
              emptyDescription="当前没有需要验收的退货商品"
            />
          ) : loadingRecords ? (
            <Skeleton className="h-[400px]" />
          ) : (
            <DataTable
              columns={recordColumns}
              data={inspectionRecords}
              pageSize={10}
              rowKey="id"
              emptyTitle="暂无验收记录"
              emptyDescription="还没有验收历史记录"
            />
          )}
        </div>
      </div>

      <Modal
        isOpen={inspectModalOpen}
        onClose={() => {
          if (!submitting) {
            setInspectModalOpen(false)
            setSelectedItem(null)
          }
        }}
        title="商品验收"
        description={`验收退货单 ${selectedItem?.id}`}
        size="lg"
        footer={
          <>
            <button
              onClick={() => {
                setInspectModalOpen(false)
                setSelectedItem(null)
              }}
              disabled={submitting}
              className={cn(
                'rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-sm font-medium',
                'text-slate-300 transition-all duration-200 hover:bg-dark-600 hover:text-white',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                submitting ||
                (inspectionResult === 'failed' && !damageDescription.trim())
              }
              className={cn(
                'rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white',
                'transition-all duration-200 hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/30',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none'
              )}
            >
              {submitting ? '提交中...' : '确认验收'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {selectedItem && (
            <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">退货单号</p>
                  <p className="mt-1 font-mono text-white">{selectedItem.id}</p>
                </div>
                <div>
                  <p className="text-slate-500">订单号</p>
                  <p className="mt-1 font-mono text-white">{selectedItem.orderId}</p>
                </div>
                <div>
                  <p className="text-slate-500">客户</p>
                  <p className="mt-1 text-white">{selectedItem.customerName}</p>
                </div>
                <div>
                  <p className="text-slate-500">退款金额</p>
                  <p className="mt-1 font-semibold text-emerald-400">
                    ¥{selectedItem.refundAmount.toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">商品</p>
                  <p className="mt-1 text-white">{selectedItem.productName}</p>
                  <p className="text-xs text-slate-500">{selectedItem.productCategory}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              验收结果 <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all duration-200',
                  inspectionResult === 'passed'
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                )}
              >
                <input
                  type="radio"
                  name="result"
                  value="passed"
                  checked={inspectionResult === 'passed'}
                  onChange={(e) => {
                    setInspectionResult(e.target.value as InspectionResult)
                    if (e.target.value === 'passed') {
                      setDamageLevel('none')
                      setDamageDescription('')
                    }
                  }}
                  className="h-4 w-4 accent-emerald-500"
                />
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-400" />
                  <div>
                    <p className="text-sm font-medium text-white">通过</p>
                    <p className="text-xs text-slate-500">商品完好无损</p>
                  </div>
                </div>
              </label>
              <label
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-all duration-200',
                  inspectionResult === 'failed'
                    ? 'border-red-500/50 bg-red-500/10'
                    : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                )}
              >
                <input
                  type="radio"
                  name="result"
                  value="failed"
                  checked={inspectionResult === 'failed'}
                  onChange={(e) => {
                    setInspectionResult(e.target.value as InspectionResult)
                    if (e.target.value === 'failed') {
                      setDamageLevel('minor')
                    }
                  }}
                  className="h-4 w-4 accent-red-500"
                />
                <div className="flex items-center gap-2">
                  <X className="h-5 w-5 text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-white">不通过</p>
                    <p className="text-xs text-slate-500">商品存在问题</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {inspectionResult === 'failed' && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  损坏等级 <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['minor', 'moderate', 'severe'] as DamageLevel[]).map((level) => {
                    const levelConfig: Record<DamageLevel, { border: string; bg: string; icon: typeof AlertTriangle; color: string }> = {
                      none: { border: 'border-slate-500/50', bg: 'bg-slate-500/10', icon: AlertTriangle, color: 'text-slate-400' },
                      minor: { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', icon: AlertTriangle, color: 'text-yellow-400' },
                      moderate: { border: 'border-orange-500/50', bg: 'bg-orange-500/10', icon: AlertTriangle, color: 'text-orange-400' },
                      severe: { border: 'border-red-500/50', bg: 'bg-red-500/10', icon: AlertTriangle, color: 'text-red-400' },
                    }
                    const config = levelConfig[level]
                    return (
                      <label
                        key={level}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border p-3 transition-all duration-200',
                          damageLevel === level
                            ? `${config.border} ${config.bg}`
                            : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                        )}
                      >
                        <input
                          type="radio"
                          name="damage"
                          value={level}
                          checked={damageLevel === level}
                          onChange={(e) => setDamageLevel(e.target.value as DamageLevel)}
                          className="h-3.5 w-3.5 accent-primary-500"
                        />
                        <config.icon className={cn('h-4 w-4', config.color)} />
                        <span className={cn('text-xs font-medium', config.color)}>
                          {DAMAGE_LEVEL_LABEL[level]}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  损坏描述 <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={damageDescription}
                  onChange={(e) => setDamageDescription(e.target.value)}
                  placeholder="请详细描述商品损坏情况..."
                  rows={4}
                  className={cn(
                    'w-full rounded-lg border border-dark-600 bg-dark-800 px-4 py-2.5 text-sm',
                    'text-white placeholder:text-slate-600 outline-none transition-all duration-200',
                    'focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20'
                  )}
                />
                {!damageDescription.trim() && (
                  <p className="mt-1.5 text-xs text-red-400">请输入损坏描述</p>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}
