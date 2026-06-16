import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  Calendar,
  Download,
} from 'lucide-react'
import DataTable, { type Column } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { useReturnsStore } from '@/store/returns'
import { dataService } from '@/services/dataService'
import { exportFilteredReturnsExcel } from '@/services/export/excelExport'
import {
  RETURN_STATUS_LABEL,
  RETURN_STATUS_COLOR,
  CUSTOMER_LEVEL_LABEL,
  RETURN_TYPE_LABEL,
  type ReturnRequest,
  type ReturnStatus,
  type CustomerLevel,
  type ReturnType,
} from '@/types'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: { value: ReturnStatus | ''; label: string }[] = [
  { value: '', label: '全部状态' },
  { value: 'pending_review', label: '待审核' },
  { value: 'reviewing', label: '审核中' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'logistics_created', label: '物流单已创建' },
  { value: 'picked_up', label: '已取件' },
  { value: 'in_transit', label: '运输中' },
  { value: 'warehouse_received', label: '仓库已签收' },
  { value: 'inspecting', label: '验收中' },
  { value: 'inspection_passed', label: '验收通过' },
  { value: 'inspection_failed', label: '验收不通过' },
  { value: 'refunding', label: '退款中' },
  { value: 'refund_completed', label: '退款完成' },
  { value: 'ticket_created', label: '已生成工单' },
  { value: 'completed', label: '已完成' },
]

const CUSTOMER_LEVEL_OPTIONS: { value: CustomerLevel | ''; label: string }[] = [
  { value: '', label: '全部等级' },
  { value: 'normal', label: '普通会员' },
  { value: 'silver', label: '白银会员' },
  { value: 'gold', label: '黄金会员' },
  { value: 'platinum', label: '铂金会员' },
]

const RETURN_TYPE_OPTIONS: { value: ReturnType | ''; label: string }[] = [
  { value: '', label: '全部类型' },
  { value: 'refund', label: '退货退款' },
  { value: 'exchange', label: '换货' },
  { value: 'refund_only', label: '仅退款' },
]

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

export default function ReturnsList() {
  const navigate = useNavigate()
  const {
    list,
    filters,
    pagination,
    loading,
    fetchList,
    setFilters,
    setPagination,
  } = useReturnsStore()
  const [exporting, setExporting] = useState(false)

  const getFilteredData = (): ReturnRequest[] => {
    let data = [...dataService.returnRequests]

    if (filters.status) {
      data = data.filter(item => item.status === filters.status)
    }
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      data = data.filter(
        item =>
          item.id.toLowerCase().includes(kw) ||
          item.orderId.toLowerCase().includes(kw) ||
          item.productName.toLowerCase().includes(kw) ||
          item.customerName.toLowerCase().includes(kw)
      )
    }
    if (filters.customerLevel) {
      data = data.filter(item => item.customerLevel === filters.customerLevel)
    }
    if (filters.returnType) {
      data = data.filter(item => item.returnType === filters.returnType)
    }
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      data = data.filter(
        item => item.createdAt >= filters.dateRange![0] && item.createdAt <= filters.dateRange![1]
      )
    }
    return data
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      const filteredData = getFilteredData()
      await exportFilteredReturnsExcel(filteredData)
      dataService.addOperationLog(
        '批量导出',
        '退货管理',
        'batch_export',
        `导出筛选退货数据 ${filteredData.length} 条`
      )
    } finally {
      setExporting(false)
    }
  }

  const [showFilters, setShowFilters] = useState(false)
  const [keyword, setKeyword] = useState(filters.keyword || '')
  const [status, setStatus] = useState<ReturnStatus | ''>(filters.status || '')
  const [customerLevel, setCustomerLevel] = useState<CustomerLevel | ''>((filters.customerLevel as CustomerLevel) || '')
  const [returnType, setReturnType] = useState<ReturnType | ''>((filters.returnType as ReturnType) || '')
  const [startDate, setStartDate] = useState(filters.dateRange?.[0] || '')
  const [endDate, setEndDate] = useState(filters.dateRange?.[1] || '')

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleSearch = () => {
    setFilters({
      keyword: keyword.trim() || undefined,
      status: status || undefined,
      customerLevel: customerLevel || undefined,
      returnType: returnType || undefined,
      dateRange: startDate && endDate ? [startDate, endDate] : undefined,
    })
  }

  const handleReset = () => {
    setKeyword('')
    setStatus('')
    setCustomerLevel('')
    setReturnType('')
    setStartDate('')
    setEndDate('')
    setFilters({})
  }

  const handleRefresh = () => {
    fetchList()
  }

  const columns: Column<ReturnRequest>[] = [
    {
      key: 'id',
      title: '退货单号',
      width: '140px',
      render: (row) => (
        <span className="font-mono text-sm text-primary-400">{row.id}</span>
      ),
    },
    {
      key: 'orderId',
      title: '订单号',
      width: '140px',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">{row.orderId}</span>
      ),
    },
    {
      key: 'productName',
      title: '商品信息',
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-white">{row.productName}</p>
          <p className="text-xs text-slate-500">{row.productCategory}</p>
        </div>
      ),
    },
    {
      key: 'customerName',
      title: '客户信息',
      width: '140px',
      render: (row) => (
        <div>
          <p className="text-sm text-white">{row.customerName}</p>
          <p className="text-xs text-slate-500">{CUSTOMER_LEVEL_LABEL[row.customerLevel]}</p>
        </div>
      ),
    },
    {
      key: 'returnType',
      title: '退货类型',
      width: '100px',
      align: 'center',
      render: (row) => (
        <span className="text-xs text-slate-300">{RETURN_TYPE_LABEL[row.returnType]}</span>
      ),
    },
    {
      key: 'refundAmount',
      title: '退款金额',
      width: '110px',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-sm text-emerald-400">
          ¥{row.refundAmount.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      width: '130px',
      align: 'center',
      render: (row) => (
        <StatusBadge status={STATUS_TO_BADGE[row.status]}>
          {RETURN_STATUS_LABEL[row.status]}
        </StatusBadge>
      ),
    },
    {
      key: 'createdAt',
      title: '申请时间',
      width: '160px',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-400 whitespace-nowrap">{row.createdAt}</span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">退货请求</h1>
          <p className="mt-1 text-sm text-slate-400">管理所有退货申请及处理流程</p>
        </div>
      </div>

      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="搜索订单号、商品名称、客户名..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full rounded-lg border border-dark-700 bg-dark-800 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
              showFilters
                ? 'border-primary-500/50 bg-primary-500/10 text-primary-400'
                : 'border-dark-700 bg-dark-800 text-slate-300 hover:border-dark-600 hover:text-white'
            )}
          >
            <Filter className="h-4 w-4" />
            筛选
            <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
          </button>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:border-dark-600 hover:text-white"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            刷新
          </button>

          <button
            onClick={handleSearch}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/30"
          >
            查询
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50"
          >
            <Download className={cn('h-4 w-4', exporting && 'animate-spin')} />
            {exporting ? '导出中...' : '导出Excel'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 gap-4 border-t border-dark-700 pt-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">状态</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ReturnStatus | '')}
                className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">客户等级</label>
              <select
                value={customerLevel}
                onChange={(e) => setCustomerLevel(e.target.value as CustomerLevel | '')}
                className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                {CUSTOMER_LEVEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">退货类型</label>
              <select
                value={returnType}
                onChange={(e) => setReturnType(e.target.value as ReturnType | '')}
                className="w-full rounded-lg border border-dark-700 bg-dark-800 px-3 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                {RETURN_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">申请日期范围</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-dark-700 bg-dark-800 pl-9 pr-3 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <span className="text-slate-500">-</span>
                <div className="relative flex-1">
                  <Calendar className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-dark-700 bg-dark-800 pl-9 pr-3 py-2.5 text-sm text-white focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={list}
        pageSize={pagination.pageSize}
        rowKey="id"
        onRowClick={(row) => navigate(`/returns/${row.id}`)}
        emptyTitle="暂无退货记录"
        emptyDescription="当前筛选条件下没有退货请求"
      />
    </div>
  )
}
