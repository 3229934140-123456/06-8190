import { useState, useMemo, useEffect } from 'react';
import {
  RefreshCw,
  Search,
  Filter,
  RotateCcw,
  Eye,
  ChevronDown,
  Calendar,
  CreditCard,
  Wallet,
  X
} from 'lucide-react';
import dayjs from 'dayjs';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import { dataService } from '@/services/dataService';
import {
  REFUND_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  REFUND_METHOD_OPTIONS,
  REFUND_STATUS_CONFIG,
  PAYMENT_METHOD_CONFIG,
  REFUND_METHOD_CONFIG,
  type RefundStatus,
  type PaymentMethod,
  type RefundMethod
} from '@/constants';
import type { RefundRecord } from '@/types';

const statusTypeMap: Record<RefundStatus, 'pending' | 'processing' | 'success' | 'error'> = {
  pending: 'pending',
  processing: 'processing',
  success: 'success',
  failed: 'error'
};

export default function Refunds() {
  const [filters, setFilters] = useState({
    status: '' as RefundStatus | '',
    paymentMethod: '' as PaymentMethod | '',
    refundMethod: '' as RefundMethod | '',
    startDate: '',
    endDate: '',
    keyword: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<RefundRecord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [refundList, setRefundList] = useState<RefundRecord[]>([...dataService.refundRecords]);

  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setRefundList([...dataService.refundRecords]);
      if (selectedRefund) {
        const updated = dataService.refundRecords.find(r => r.id === selectedRefund.id);
        if (updated) setSelectedRefund(updated);
      }
    });
    return unsubscribe;
  }, [selectedRefund]);

  const filteredData = useMemo(() => {
    return refundList.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.paymentMethod && item.originalPaymentMethod !== filters.paymentMethod) return false;
      if (filters.refundMethod && item.refundMethod !== filters.refundMethod) return false;
      if (filters.startDate && dayjs(item.processedAt).isBefore(dayjs(filters.startDate))) return false;
      if (filters.endDate && dayjs(item.processedAt).isAfter(dayjs(filters.endDate).endOf('day'))) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        return (
          item.id.toLowerCase().includes(kw) ||
          item.returnId.toLowerCase().includes(kw) ||
          item.orderId.toLowerCase().includes(kw) ||
          item.transactionId.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [filters, refundList]);

  const handleViewDetail = (record: RefundRecord) => {
    setSelectedRefund(record);
    setDetailModalOpen(true);
  };

  const handleRetry = async (record: RefundRecord) => {
    setRetrying(record.id);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRetrying(null);
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      paymentMethod: '',
      refundMethod: '',
      startDate: '',
      endDate: '',
      keyword: ''
    });
  };

  const columns = [
    {
      key: 'id',
      title: '退款单号',
      sortable: true,
      width: '140px',
      render: (row: RefundRecord) => (
        <span className="font-mono text-sm text-primary-400">{row.id}</span>
      )
    },
    {
      key: 'returnId',
      title: '退货单',
      sortable: true,
      width: '140px',
      render: (row: RefundRecord) => (
        <span className="font-mono text-sm text-slate-300">{row.returnId}</span>
      )
    },
    {
      key: 'originalPaymentMethod',
      title: '原支付方式',
      sortable: true,
      width: '120px',
      render: (row: RefundRecord) => (
        <div className="flex items-center gap-2">
          {row.originalPaymentMethod === 'alipay' && <Wallet className="h-4 w-4 text-blue-400" />}
          {row.originalPaymentMethod === 'wechat' && <Wallet className="h-4 w-4 text-green-400" />}
          {row.originalPaymentMethod === 'bank' && <CreditCard className="h-4 w-4 text-purple-400" />}
          {row.originalPaymentMethod === 'points' && <CreditCard className="h-4 w-4 text-yellow-400" />}
          <span>{PAYMENT_METHOD_CONFIG[row.originalPaymentMethod]}</span>
        </div>
      )
    },
    {
      key: 'refundMethod',
      title: '退款方式',
      sortable: true,
      width: '120px',
      render: (row: RefundRecord) => (
        <span className="text-slate-300">{REFUND_METHOD_CONFIG[row.refundMethod]}</span>
      )
    },
    {
      key: 'refundAmount',
      title: '金额',
      sortable: true,
      align: 'right' as const,
      headerAlign: 'right' as const,
      width: '120px',
      render: (row: RefundRecord) => (
        <div className="text-right">
          <span className="font-semibold text-white">¥{row.refundAmount.toLocaleString()}</span>
          {row.pointsAmount > 0 && (
            <div className="text-xs text-yellow-400">+{row.pointsAmount}积分</div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      width: '100px',
      render: (row: RefundRecord) => (
        <StatusBadge status={statusTypeMap[row.status]}>
          {REFUND_STATUS_CONFIG[row.status].label}
        </StatusBadge>
      )
    },
    {
      key: 'processedAt',
      title: '处理时间',
      sortable: true,
      width: '170px',
      render: (row: RefundRecord) => (
        <span className="text-sm text-slate-400">{row.processedAt}</span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      width: '160px',
      align: 'right' as const,
      headerAlign: 'right' as const,
      render: (row: RefundRecord) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleViewDetail(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-600 bg-dark-800 text-slate-400 transition-all hover:border-primary-500/50 hover:text-primary-400"
            title="查看详情"
          >
            <Eye className="h-4 w-4" />
          </button>
          {row.status === 'failed' && (
            <button
              onClick={() => handleRetry(row)}
              disabled={retrying === row.id}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg border transition-all',
                retrying === row.id
                  ? 'cursor-not-allowed border-dark-600 bg-dark-800 text-slate-600'
                  : 'border-orange-500/50 bg-orange-500/10 text-orange-400 hover:border-orange-400 hover:bg-orange-500/20'
              )}
              title="重试退款"
            >
              <RefreshCw className={cn('h-4 w-4', retrying === row.id && 'animate-spin')} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">退款处理</h1>
          <p className="mt-1 text-sm text-slate-400">管理所有退款申请，处理异常退款重试</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetFilters}
            className="btn-secondary flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            重置
          </button>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="搜索退款单号、退货单号、订单号、交易流水号..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'btn-secondary flex items-center gap-2',
              (filters.status || filters.paymentMethod || filters.refundMethod || filters.startDate || filters.endDate) &&
                'border-primary-500/50 bg-primary-500/10 text-primary-400'
            )}
          >
            <Filter className="h-4 w-4" />
            筛选
            <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-dark-700 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">状态</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as RefundStatus | '' })}
                className="input-field"
              >
                <option value="">全部状态</option>
                {REFUND_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">支付方式</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value as PaymentMethod | '' })}
                className="input-field"
              >
                <option value="">全部支付方式</option>
                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">退款方式</label>
              <select
                value={filters.refundMethod}
                onChange={(e) => setFilters({ ...filters, refundMethod: e.target.value as RefundMethod | '' })}
                className="input-field"
              >
                <option value="">全部退款方式</option>
                {REFUND_METHOD_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">日期范围</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="input-field pl-8 text-sm"
                  />
                </div>
                <span className="text-slate-500">-</span>
                <div className="relative flex-1">
                  <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="input-field pl-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        pageSize={10}
        rowKey="id"
        emptyTitle="暂无退款记录"
        emptyDescription="当前没有符合条件的退款记录"
      />

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="退款详情"
        description={`退款单号：${selectedRefund?.id || ''}`}
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            {selectedRefund?.status === 'failed' && (
              <button
                onClick={() => selectedRefund && handleRetry(selectedRefund)}
                disabled={retrying === selectedRefund.id}
                className="btn-accent flex items-center gap-2"
              >
                <RefreshCw className={cn('h-4 w-4', retrying === selectedRefund.id && 'animate-spin')} />
                重试退款
              </button>
            )}
            <button onClick={() => setDetailModalOpen(false)} className="btn-secondary">
              关闭
            </button>
          </div>
        }
      >
        {selectedRefund && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">退款单号</div>
                <div className="mt-1 font-mono text-sm text-primary-400">{selectedRefund.id}</div>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">关联退货单</div>
                <div className="mt-1 font-mono text-sm text-white">{selectedRefund.returnId}</div>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">关联订单号</div>
                <div className="mt-1 font-mono text-sm text-white">{selectedRefund.orderId}</div>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">交易流水号</div>
                <div className="mt-1 font-mono text-sm text-white">{selectedRefund.transactionId}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">原支付方式</div>
                <div className="mt-1 flex items-center gap-2">
                  {selectedRefund.originalPaymentMethod === 'alipay' && <Wallet className="h-4 w-4 text-blue-400" />}
                  {selectedRefund.originalPaymentMethod === 'wechat' && <Wallet className="h-4 w-4 text-green-400" />}
                  {selectedRefund.originalPaymentMethod === 'bank' && <CreditCard className="h-4 w-4 text-purple-400" />}
                  {selectedRefund.originalPaymentMethod === 'points' && <CreditCard className="h-4 w-4 text-yellow-400" />}
                  <span className="text-sm text-white">{PAYMENT_METHOD_CONFIG[selectedRefund.originalPaymentMethod]}</span>
                </div>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">退款方式</div>
                <div className="mt-1 text-sm text-white">{REFUND_METHOD_CONFIG[selectedRefund.refundMethod]}</div>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">状态</div>
                <div className="mt-1">
                  <StatusBadge status={statusTypeMap[selectedRefund.status]}>
                    {REFUND_STATUS_CONFIG[selectedRefund.status].label}
                  </StatusBadge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-dark-700 bg-gradient-to-br from-primary-900/30 to-dark-900/50 p-5">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-slate-400">退款金额</div>
                  <div className="mt-1 font-display text-3xl font-bold text-white">
                    ¥{selectedRefund.refundAmount.toLocaleString()}
                  </div>
                </div>
                {selectedRefund.pointsAmount > 0 && (
                  <div className="text-right">
                    <div className="text-xs text-slate-400">积分补偿</div>
                    <div className="mt-1 text-xl font-semibold text-yellow-400">
                      +{selectedRefund.pointsAmount.toLocaleString()} 积分
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
              <div className="text-xs text-slate-500">处理时间</div>
              <div className="mt-1 text-sm text-white">{selectedRefund.processedAt}</div>
            </div>

            {selectedRefund.status === 'failed' && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <div className="flex items-start gap-3">
                  <X className="mt-0.5 h-5 w-5 text-red-400" />
                  <div>
                    <div className="text-sm font-medium text-red-400">退款失败</div>
                    <div className="mt-1 text-xs text-red-300/80">
                      可能原因：支付通道异常、账户信息错误或网络问题。建议检查后重试。
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
