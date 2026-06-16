import { useState, useEffect } from 'react'
import { Check, X, FileText, Users, Clock } from 'lucide-react'
import DataTable, { Column } from '@/components/ui/DataTable'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/ui/StatusBadge'
import KPICard from '@/components/ui/KPICard'
import Skeleton from '@/components/ui/Skeleton'
import { useReturnsStore } from '@/store/returns'
import {
  RETURN_STATUS_LABEL,
  RETURN_TYPE_LABEL,
  CUSTOMER_LEVEL_LABEL,
} from '@/types'
import type { ReturnRequest } from '@/types'
import { cn } from '@/lib/utils'

type ApprovalTab = 'pending' | 'approved'

const getApprovalStatusType = (status: ReturnRequest['status']): 'pending' | 'approved' | 'rejected' | 'processing' => {
  if (status === 'pending_review' || status === 'reviewing') return 'pending'
  if (status === 'approved') return 'approved'
  if (status === 'rejected') return 'rejected'
  return 'processing'
}

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<ApprovalTab>('pending')
  const [selectedItem, setSelectedItem] = useState<ReturnRequest | null>(null)
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [remark, setRemark] = useState('')
  const { list, loading, fetchList, setFilters, approve, reject } = useReturnsStore()

  useEffect(() => {
    if (activeTab === 'pending') {
      setFilters({ status: undefined })
    } else {
      setFilters({ status: undefined })
    }
  }, [activeTab, setFilters])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const pendingList = list.filter(
    (item) => item.status === 'pending_review' || item.status === 'reviewing'
  )

  const approvedList = list.filter(
    (item) => item.status === 'approved' || item.status === 'rejected'
  )

  const displayList = activeTab === 'pending' ? pendingList : approvedList

  const pendingCount = list.filter(
    (item) => item.status === 'pending_review' || item.status === 'reviewing'
  ).length
  const approvedCount = list.filter((item) => item.status === 'approved').length
  const rejectedCount = list.filter((item) => item.status === 'rejected').length

  const handleApprove = async () => {
    if (!selectedItem) return
    await approve(selectedItem.id, remark || undefined)
    setApproveModalOpen(false)
    setSelectedItem(null)
    setRemark('')
  }

  const handleReject = async () => {
    if (!selectedItem || !remark.trim()) return
    await reject(selectedItem.id, remark)
    setRejectModalOpen(false)
    setSelectedItem(null)
    setRemark('')
  }

  const openApproveModal = (item: ReturnRequest) => {
    setSelectedItem(item)
    setRemark('')
    setApproveModalOpen(true)
  }

  const openRejectModal = (item: ReturnRequest) => {
    setSelectedItem(item)
    setRemark('')
    setRejectModalOpen(true)
  }

  const columns: Column<ReturnRequest>[] = [
    {
      key: 'orderId',
      title: '订单号',
      width: '150px',
      render: (row) => (
        <span className="font-mono text-sm text-slate-200">{row.orderId}</span>
      ),
    },
    {
      key: 'productName',
      title: '商品',
      width: '200px',
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
      width: '130px',
      render: (row) => (
        <div>
          <p className="text-sm text-white">{row.customerName}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {CUSTOMER_LEVEL_LABEL[row.customerLevel]}
          </p>
        </div>
      ),
    },
    {
      key: 'returnType',
      title: '退货类型',
      width: '110px',
      align: 'center',
      render: (row) => (
        <span className="text-sm text-slate-300">
          {RETURN_TYPE_LABEL[row.returnType]}
        </span>
      ),
    },
    {
      key: 'refundAmount',
      title: '申请金额',
      width: '120px',
      align: 'right',
      render: (row) => (
        <span className="text-sm font-semibold text-emerald-400">
          ¥{row.refundAmount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: '申请时间',
      width: '170px',
      sortable: true,
      render: (row) => <span className="text-sm text-slate-400">{row.createdAt}</span>,
    },
    {
      key: 'status',
      title: '状态',
      width: '110px',
      align: 'center',
      render: (row) => {
        const statusType = getApprovalStatusType(row.status)
        return (
          <StatusBadge status={statusType}>
            {RETURN_STATUS_LABEL[row.status]}
          </StatusBadge>
        )
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: '160px',
      align: 'center',
      render: (row) => {
        if (activeTab === 'approved') return null
        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openApproveModal(row)
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border border-emerald-500/30',
                'bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400',
                'transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/20 hover:text-emerald-300'
              )}
            >
              <Check className="h-3.5 w-3.5" />
              通过
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                openRejectModal(row)
              }}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg border border-red-500/30',
                'bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400',
                'transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/20 hover:text-red-300'
              )}
            >
              <X className="h-3.5 w-3.5" />
              驳回
            </button>
          </div>
        )
      },
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
          title="待审批"
          value={pendingCount}
          icon={Clock}
          gradient="orange"
          subtitle="需要处理的退货申请"
        />
        <KPICard
          title="已通过"
          value={approvedCount}
          icon={Check}
          gradient="emerald"
          subtitle="审批通过的申请"
        />
        <KPICard
          title="已驳回"
          value={rejectedCount}
          icon={X}
          gradient="purple"
          subtitle="审批驳回的申请"
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
              <FileText className="h-4 w-4" />
              待审批
              {pendingCount > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500/20 px-1.5 text-xs font-semibold text-orange-400">
                  {pendingCount}
                </span>
              )}
            </span>
            {activeTab === 'pending' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={cn(
              'relative px-5 py-3.5 text-sm font-medium transition-all duration-200',
              activeTab === 'approved'
                ? 'text-primary-400'
                : 'text-slate-400 hover:text-slate-300'
            )}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              已审批
            </span>
            {activeTab === 'approved' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
        </div>

        <div className="p-4">
          <DataTable
            columns={columns}
            data={displayList}
            pageSize={10}
            rowKey="id"
            emptyTitle={activeTab === 'pending' ? '暂无待审批申请' : '暂无审批记录'}
            emptyDescription={
              activeTab === 'pending' ? '当前没有需要处理的退货申请' : '还没有审批历史记录'
            }
          />
        </div>
      </div>

      <Modal
        isOpen={approveModalOpen}
        onClose={() => {
          setApproveModalOpen(false)
          setSelectedItem(null)
          setRemark('')
        }}
        title="审批通过"
        description={`确定通过退货申请 ${selectedItem?.orderId} 吗？`}
        footer={
          <>
            <button
              onClick={() => {
                setApproveModalOpen(false)
                setSelectedItem(null)
                setRemark('')
              }}
              className={cn(
                'rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-sm font-medium',
                'text-slate-300 transition-all duration-200 hover:bg-dark-600 hover:text-white'
              )}
            >
              取消
            </button>
            <button
              onClick={handleApprove}
              className={cn(
                'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white',
                'transition-all duration-200 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30'
              )}
            >
              确认通过
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedItem && (
            <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">订单号</p>
                  <p className="mt-1 font-mono text-white">{selectedItem.orderId}</p>
                </div>
                <div>
                  <p className="text-slate-500">申请金额</p>
                  <p className="mt-1 font-semibold text-emerald-400">
                    ¥{selectedItem.refundAmount.toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">商品</p>
                  <p className="mt-1 text-white">{selectedItem.productName}</p>
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              审批意见（可选）
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入审批意见..."
              rows={3}
              className={cn(
                'w-full rounded-lg border border-dark-600 bg-dark-800 px-4 py-2.5 text-sm',
                'text-white placeholder:text-slate-600 outline-none transition-all duration-200',
                'focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20'
              )}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false)
          setSelectedItem(null)
          setRemark('')
        }}
        title="审批驳回"
        description={`确定驳回退货申请 ${selectedItem?.orderId} 吗？`}
        footer={
          <>
            <button
              onClick={() => {
                setRejectModalOpen(false)
                setSelectedItem(null)
                setRemark('')
              }}
              className={cn(
                'rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-sm font-medium',
                'text-slate-300 transition-all duration-200 hover:bg-dark-600 hover:text-white'
              )}
            >
              取消
            </button>
            <button
              onClick={handleReject}
              disabled={!remark.trim()}
              className={cn(
                'rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white',
                'transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/30',
                'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none'
              )}
            >
              确认驳回
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedItem && (
            <div className="rounded-lg border border-dark-700 bg-dark-800/50 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">订单号</p>
                  <p className="mt-1 font-mono text-white">{selectedItem.orderId}</p>
                </div>
                <div>
                  <p className="text-slate-500">申请金额</p>
                  <p className="mt-1 font-semibold text-emerald-400">
                    ¥{selectedItem.refundAmount.toFixed(2)}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-500">商品</p>
                  <p className="mt-1 text-white">{selectedItem.productName}</p>
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              驳回理由 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="请输入驳回理由..."
              rows={4}
              className={cn(
                'w-full rounded-lg border border-dark-600 bg-dark-800 px-4 py-2.5 text-sm',
                'text-white placeholder:text-slate-600 outline-none transition-all duration-200',
                'focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20'
              )}
            />
            {!remark.trim() && (
              <p className="mt-1.5 text-xs text-red-400">请输入驳回理由</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
