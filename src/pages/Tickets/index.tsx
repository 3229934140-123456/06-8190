import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  Eye,
  ChevronDown,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileText
} from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import Timeline, { type TimelineItem } from '@/components/ui/Timeline';
import { cn } from '@/lib/utils';
import { dataService } from '@/services/dataService';
import {
  TICKET_STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  LIABILITY_PARTY_OPTIONS,
  TICKET_STATUS_CONFIG,
  PRIORITY_CONFIG,
  LIABILITY_PARTY_CONFIG,
  type TicketStatus,
  type Priority,
  type LiabilityParty
} from '@/constants';
import type { LiabilityTicket } from '@/types';

const ticketStatusTypeMap: Record<TicketStatus, 'pending' | 'processing' | 'completed' | 'cancelled'> = {
  pending: 'pending',
  processing: 'processing',
  resolved: 'completed',
  closed: 'cancelled'
};

const priorityTypeMap: Record<Priority, 'info' | 'warning' | 'error' | 'pending'> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  urgent: 'pending'
};

const liabilityColorMap: Record<LiabilityParty, string> = {
  customer: 'text-blue-400',
  merchant: 'text-red-400',
  logistics: 'text-yellow-400',
  unknown: 'text-slate-400'
};

export default function Tickets() {
  const [filters, setFilters] = useState({
    status: '' as TicketStatus | '',
    priority: '' as Priority | '',
    liabilityParty: '' as LiabilityParty | '',
    keyword: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<LiabilityTicket | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [ticketList, setTicketList] = useState<LiabilityTicket[]>([...dataService.liabilityTickets]);

  useEffect(() => {
    const unsubscribe = dataService.subscribe(() => {
      setTicketList([...dataService.liabilityTickets]);
      if (selectedTicket) {
        const updated = dataService.liabilityTickets.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    });
    return unsubscribe;
  }, [selectedTicket]);

  const pendingCount = ticketList.filter(t => t.status === 'pending').length;

  const filteredData = useMemo(() => {
    return ticketList.filter((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.priority && item.priority !== filters.priority) return false;
      if (filters.liabilityParty && item.liabilityParty !== filters.liabilityParty) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        return (
          item.id.toLowerCase().includes(kw) ||
          item.returnId.toLowerCase().includes(kw) ||
          item.orderId.toLowerCase().includes(kw) ||
          item.assignee.toLowerCase().includes(kw) ||
          item.description.toLowerCase().includes(kw)
        );
      }
      return true;
    });
  }, [filters, ticketList]);

  const handleViewDetail = (ticket: LiabilityTicket) => {
    setSelectedTicket(ticket);
    setDetailModalOpen(true);
  };

  const handleResetFilters = () => {
    setFilters({
      status: '',
      priority: '',
      liabilityParty: '',
      keyword: ''
    });
  };

  const getTimelineItems = (ticket: LiabilityTicket): TimelineItem[] => {
    const items: TimelineItem[] = [
      {
        id: '1',
        title: '工单创建',
        description: ticket.description,
        time: ticket.createdAt,
        status: 'completed',
        user: '系统自动'
      }
    ];

    if (ticket.status === 'processing' || ticket.status === 'resolved' || ticket.status === 'closed') {
      items.push({
        id: '2',
        title: '工单已分配',
        description: `已分配给 ${ticket.assignee} 处理`,
        time: ticket.createdAt,
        status: 'completed',
        user: '系统自动'
      });
    }

    if (ticket.status === 'processing') {
      items.push({
        id: '3',
        title: '责任判定中',
        description: '正在收集证据，进行责任判定',
        time: ticket.createdAt,
        status: 'current',
        user: ticket.assignee
      });
    }

    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      items.push({
        id: '3',
        title: '责任判定完成',
        description: `判定为 ${LIABILITY_PARTY_CONFIG[ticket.liabilityParty].label}`,
        time: ticket.resolvedAt,
        status: 'completed',
        user: ticket.assignee
      });
      items.push({
        id: '4',
        title: ticket.status === 'resolved' ? '工单已解决' : '工单已关闭',
        description: ticket.resolution,
        time: ticket.resolvedAt,
        status: 'completed',
        user: ticket.assignee,
        icon: ticket.status === 'resolved' ? CheckCircle2 : XCircle
      });
    }

    return items;
  };

  const columns = [
    {
      key: 'id',
      title: '工单号',
      sortable: true,
      width: '140px',
      render: (row: LiabilityTicket) => (
        <span className="font-mono text-sm text-primary-400">{row.id}</span>
      )
    },
    {
      key: 'returnId',
      title: '退货单',
      sortable: true,
      width: '140px',
      render: (row: LiabilityTicket) => (
        <span className="font-mono text-sm text-slate-300">{row.returnId}</span>
      )
    },
    {
      key: 'assignee',
      title: '分配人',
      sortable: true,
      width: '100px',
      render: (row: LiabilityTicket) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm text-slate-200">{row.assignee}</span>
        </div>
      )
    },
    {
      key: 'liabilityParty',
      title: '责任方',
      sortable: true,
      width: '100px',
      render: (row: LiabilityTicket) => (
        <span className={cn('text-sm font-medium', liabilityColorMap[row.liabilityParty])}>
          {LIABILITY_PARTY_CONFIG[row.liabilityParty].label}
        </span>
      )
    },
    {
      key: 'priority',
      title: '优先级',
      sortable: true,
      width: '90px',
      render: (row: LiabilityTicket) => (
        <StatusBadge status={priorityTypeMap[row.priority]}>
          {PRIORITY_CONFIG[row.priority].label}
        </StatusBadge>
      )
    },
    {
      key: 'status',
      title: '状态',
      sortable: true,
      width: '100px',
      render: (row: LiabilityTicket) => (
        <StatusBadge status={ticketStatusTypeMap[row.status]}>
          {TICKET_STATUS_CONFIG[row.status].label}
        </StatusBadge>
      )
    },
    {
      key: 'description',
      title: '问题描述',
      render: (row: LiabilityTicket) => (
        <span className="line-clamp-1 text-sm text-slate-300" title={row.description}>
          {row.description}
        </span>
      )
    },
    {
      key: 'actions',
      title: '操作',
      width: '100px',
      align: 'right' as const,
      headerAlign: 'right' as const,
      render: (row: LiabilityTicket) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleViewDetail(row)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-dark-600 bg-dark-800 text-slate-400 transition-all hover:border-primary-500/50 hover:text-primary-400"
            title="查看详情"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">责任工单管理</h1>
          <p className="mt-1 text-sm text-slate-400">处理退货责任判定工单，跟踪处理进度</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">
              {pendingCount} 待处理
            </span>
          </div>
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
              placeholder="搜索工单号、退货单号、订单号、分配人、描述..."
              value={filters.keyword}
              onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'btn-secondary flex items-center gap-2',
              (filters.status || filters.priority || filters.liabilityParty) &&
                'border-primary-500/50 bg-primary-500/10 text-primary-400'
            )}
          >
            <Filter className="h-4 w-4" />
            筛选
            <ChevronDown className={cn('h-4 w-4 transition-transform', showFilters && 'rotate-180')} />
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-dark-700 pt-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">状态</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as TicketStatus | '' })}
                className="input-field"
              >
                <option value="">全部状态</option>
                {TICKET_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">优先级</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value as Priority | '' })}
                className="input-field"
              >
                <option value="">全部优先级</option>
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">责任方</label>
              <select
                value={filters.liabilityParty}
                onChange={(e) => setFilters({ ...filters, liabilityParty: e.target.value as LiabilityParty | '' })}
                className="input-field"
              >
                <option value="">全部责任方</option>
                {LIABILITY_PARTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        pageSize={10}
        rowKey="id"
        emptyTitle="暂无工单"
        emptyDescription="当前没有符合条件的责任工单"
      />

      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="工单详情"
        description={`工单号：${selectedTicket?.id || ''}`}
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setDetailModalOpen(false)} className="btn-secondary">
              关闭
            </button>
          </div>
        }
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">工单号</div>
                <div className="mt-1 font-mono text-sm text-primary-400">{selectedTicket.id}</div>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">关联退货单</div>
                <div className="mt-1 font-mono text-sm text-white">{selectedTicket.returnId}</div>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">关联订单号</div>
                <div className="mt-1 font-mono text-sm text-white">{selectedTicket.orderId}</div>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">状态</div>
                <div className="mt-1">
                  <StatusBadge status={ticketStatusTypeMap[selectedTicket.status]}>
                    {TICKET_STATUS_CONFIG[selectedTicket.status].label}
                  </StatusBadge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">分配人</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500/20 text-primary-400">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-white">{selectedTicket.assignee}</span>
                </div>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">责任方判定</div>
                <div className="mt-2">
                  <span className={cn('text-sm font-semibold', liabilityColorMap[selectedTicket.liabilityParty])}>
                    {LIABILITY_PARTY_CONFIG[selectedTicket.liabilityParty].label}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">优先级</div>
                <div className="mt-2">
                  <StatusBadge status={priorityTypeMap[selectedTicket.priority]}>
                    {PRIORITY_CONFIG[selectedTicket.priority].label}
                  </StatusBadge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-400">问题描述</span>
              </div>
              <p className="text-sm text-slate-200">{selectedTicket.description}</p>
            </div>

            {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">处理结果</span>
                </div>
                <p className="text-sm text-emerald-200">{selectedTicket.resolution}</p>
              </div>
            )}

            <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-white">处理记录</span>
              </div>
              <Timeline items={getTimelineItems(selectedTicket)} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                <div className="text-xs text-slate-500">创建时间</div>
                <div className="mt-1 text-sm text-white">{selectedTicket.createdAt}</div>
              </div>
              {selectedTicket.resolvedAt && (
                <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
                  <div className="text-xs text-slate-500">解决时间</div>
                  <div className="mt-1 text-sm text-white">{selectedTicket.resolvedAt}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
