import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactECharts from 'echarts-for-react'
import {
  Package,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Truck,
  Wrench,
  ChevronRight,
  Bell,
} from 'lucide-react'
import KPICard from '@/components/ui/KPICard'
import StatusBadge from '@/components/ui/StatusBadge'
import Timeline, { type TimelineItem } from '@/components/ui/Timeline'
import { useReportsStore } from '@/store/reports'
import { useUserStore } from '@/store/user'
import { useReturnsStore } from '@/store/returns'
import {
  RETURN_STATUS_LABEL,
  ALERT_SEVERITY_COLOR,
  ALERT_SEVERITY_LABEL,
  ALERT_TYPE_LABEL,
  type ReturnStatus,
} from '@/types'

const STATUS_TO_BADGE: Record<ReturnStatus, string> = {
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

export default function Dashboard() {
  const navigate = useNavigate()
  const { dailyData, summary, loading: reportsLoading, fetchDailyData, fetchSummary, getReasonDistribution } = useReportsStore()
  const { alerts, unreadCount, loading: alertsLoading, fetchAlerts, markAlertRead } = useUserStore()
  const { list, loading: returnsLoading, fetchList } = useReturnsStore()

  useEffect(() => {
    fetchDailyData()
    fetchSummary()
    fetchAlerts()
    fetchList()
  }, [fetchDailyData, fetchSummary, fetchAlerts, fetchList])

  const todayData = useMemo(() => {
    if (dailyData.length === 0) return null
    return dailyData[dailyData.length - 1]
  }, [dailyData])

  const pendingTasks = useMemo(() => {
    const tasks: TimelineItem[] = []
    
    const pendingReview = list.filter(r => r.status === 'pending_review').slice(0, 3)
    pendingReview.forEach((r, i) => {
      tasks.push({
        id: `review-${i}`,
        title: `待审批：${r.productName}`,
        description: `客户：${r.customerName} | 单号：${r.id}`,
        time: r.createdAt,
        status: 'current',
        user: '待处理',
        icon: CheckCircle,
      })
    })

    const pendingInspection = list.filter(r => r.status === 'warehouse_received').slice(0, 2)
    pendingInspection.forEach((r, i) => {
      tasks.push({
        id: `inspect-${i}`,
        title: `待验收：${r.productName}`,
        description: `仓库已签收，单号：${r.id}`,
        time: r.updatedAt,
        status: 'current',
        user: '待处理',
        icon: Wrench,
      })
    })

    const pendingLogistics = list.filter(r => r.status === 'approved').slice(0, 2)
    pendingLogistics.forEach((r, i) => {
      tasks.push({
        id: `logistics-${i}`,
        title: `待生成物流单：${r.productName}`,
        description: `审批已通过，单号：${r.id}`,
        time: r.updatedAt,
        status: 'current',
        user: '待处理',
        icon: Truck,
      })
    })

    return tasks.slice(0, 6)
  }, [list])

  const lineChartOption = useMemo(() => {
    const dates = dailyData.map(d => d.date.substring(5))
    const returnRates = dailyData.map(d => (d.returnRate * 100).toFixed(2))

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0' },
        formatter: (params: any) => {
          const item = params[0]
          return `${item.name}<br/>退货率: <b>${item.value}%</b>`
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        name: '退货率 (%)',
        nameTextStyle: { color: '#64748b', fontSize: 11 },
        axisLine: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      series: [
        {
          name: '退货率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: returnRates,
          lineStyle: {
            color: '#6366f1',
            width: 3,
            shadowColor: 'rgba(99, 102, 241, 0.4)',
            shadowBlur: 10,
          },
          itemStyle: {
            color: '#6366f1',
            borderColor: '#1e1b4b',
            borderWidth: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(99, 102, 241, 0.35)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0.02)' },
              ],
            },
          },
        },
      ],
    }
  }, [dailyData])

  const pieChartOption = useMemo(() => {
    const reasonDist = getReasonDistribution()
    const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316']

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#e2e8f0' },
        formatter: '{b}: {c} ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#94a3b8', fontSize: 11 },
      },
      series: [
        {
          name: '退货原因',
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#0f172a',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 13,
              fontWeight: 'bold',
              color: '#fff',
            },
            itemStyle: {
              shadowBlur: 15,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          labelLine: { show: false },
          data: reasonDist.map((item, index) => ({
            value: item.count,
            name: item.reason,
            itemStyle: { color: colors[index % colors.length] },
          })),
        },
      ],
    }
  }, [getReasonDistribution])

  const kpiLoading = reportsLoading || !summary || !todayData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">数据仪表盘</h1>
          <p className="mt-1 text-sm text-slate-400">退货管理系统整体运营概览</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="今日退货量"
          value={kpiLoading ? '--' : todayData?.totalReturns || 0}
          icon={Package}
          gradient="blue"
          subtitle="单日新增退货申请"
          trend={{ direction: 'up', value: '12.5%', label: '较昨日' }}
        />
        <KPICard
          title="待处理数"
          value={kpiLoading ? '--' : list.filter(r => ['pending_review', 'reviewing', 'approved', 'warehouse_received'].includes(r.status)).length}
          icon={Clock}
          gradient="orange"
          subtitle="等待处理的退货单"
          onClick={() => navigate('/returns')}
        />
        <KPICard
          title="异常数"
          value={kpiLoading ? '--' : unreadCount}
          icon={AlertTriangle}
          gradient="purple"
          subtitle="告警与异常事件"
          trend={{ direction: 'down', value: '8.2%', label: '较昨日' }}
        />
        <KPICard
          title="退货率"
          value={kpiLoading ? '--' : `${((summary?.returnRate || 0) * 100).toFixed(2)}%`}
          icon={TrendingUp}
          gradient="emerald"
          subtitle="近30天平均退货率"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">退货率趋势</h3>
            <span className="text-xs text-slate-500">近30天</span>
          </div>
          <ReactECharts
            option={lineChartOption}
            style={{ height: 320 }}
            opts={{ renderer: 'canvas' }}
          />
        </div>

        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">退货原因分布</h3>
          </div>
          <ReactECharts
            option={pieChartOption}
            style={{ height: 320 }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">待办任务</h3>
            <button
              onClick={() => navigate('/returns')}
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
            >
              查看全部 <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          {pendingTasks.length > 0 ? (
            <Timeline items={pendingTasks} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <CheckCircle className="mb-2 h-10 w-10" />
              <p className="text-sm">暂无待办任务</p>
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white">异常告警</h3>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                  <Bell className="mr-1 h-3 w-3" />
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse rounded-lg border border-dark-700 bg-dark-800/50 p-3">
                    <div className="h-4 w-32 rounded bg-dark-700 mb-2" />
                    <div className="h-3 w-full rounded bg-dark-700" />
                  </div>
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Bell className="mb-2 h-10 w-10" />
                <p className="text-sm">暂无告警信息</p>
              </div>
            ) : (
              alerts.slice(0, 8).map(alert => (
                <div
                  key={alert.id}
                  onClick={() => {
                    if (alert.status === 'unread') markAlertRead(alert.id)
                    navigate(`/returns/${alert.relatedId}`)
                  }}
                  className="group cursor-pointer rounded-lg border border-dark-700 bg-dark-800/50 p-3 transition-all duration-200 hover:border-primary-500/40 hover:bg-dark-700/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: ALERT_SEVERITY_COLOR[alert.severity] }}
                        />
                        <span className="text-sm font-medium text-white truncate">{alert.title}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{alert.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <StatusBadge status={alert.status === 'unread' ? 'warning' : alert.status === 'resolved' ? 'success' : 'info'} showDot={false}>
                        {ALERT_SEVERITY_LABEL[alert.severity]}
                      </StatusBadge>
                      <span className="text-[10px] text-slate-600">{alert.createdAt.substring(5, 16)}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{ALERT_TYPE_LABEL[alert.type]}</span>
                    <span className="text-[10px] text-slate-600">·</span>
                    <span className="text-[10px] text-slate-500">单号：{alert.relatedId}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
