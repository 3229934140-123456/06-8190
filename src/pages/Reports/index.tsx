import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Calendar,
  FileDown,
  FileText,
  TrendingUp,
  Package,
  DollarSign,
  Clock,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Truck
} from 'lucide-react';
import dayjs from 'dayjs';
import KPICard from '@/components/ui/KPICard';
import { cn } from '@/lib/utils';
import { mockData } from '@/services/mock/data';
import { exportReportsExcel } from '@/services/export/excelExport';
import { downloadReportPdf } from '@/services/export/pdfExport';

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    start: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD')
  });
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  const filteredReports = useMemo(() => {
    return mockData.reports.filter((r) => {
      const date = dayjs(r.date);
      return date.isAfter(dayjs(dateRange.start).subtract(1, 'day')) &&
        date.isBefore(dayjs(dateRange.end).add(1, 'day'));
    });
  }, [dateRange]);

  const summary = useMemo(() => {
    if (filteredReports.length === 0) {
      return {
        totalReturns: 0,
        avgReturnRate: 0,
        avgApprovedRate: 0,
        avgProcessingHours: 0,
        totalRefund: 0,
        totalLogisticsCost: 0
      };
    }
    return {
      totalReturns: filteredReports.reduce((sum, r) => sum + r.totalReturns, 0),
      avgReturnRate: filteredReports.reduce((sum, r) => sum + r.returnRate, 0) / filteredReports.length,
      avgApprovedRate: filteredReports.reduce((sum, r) => sum + r.approvedRate, 0) / filteredReports.length,
      avgProcessingHours: filteredReports.reduce((sum, r) => sum + r.averageProcessingHours, 0) / filteredReports.length,
      totalRefund: filteredReports.reduce((sum, r) => sum + r.refundTotalAmount, 0),
      totalLogisticsCost: filteredReports.reduce((sum, r) => sum + r.logisticsTotalCost, 0)
    };
  }, [filteredReports]);

  const trendOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
        formatter: (params: unknown[]) => {
          const p = params[0] as { axisValue: string; value: number };
          return `${p.axisValue}<br/>退货率: <span style="color:#3b82f6;font-weight:bold">${(p.value * 100).toFixed(2)}%</span>`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: filteredReports.map((r) => r.date.slice(5)),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
          formatter: (val: number) => `${(val * 100).toFixed(1)}%`
        },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
      },
      series: [
        {
          name: '退货率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          data: filteredReports.map((r) => r.returnRate),
          lineStyle: { color: '#3b82f6', width: 2.5 },
          itemStyle: { color: '#3b82f6', borderColor: '#1e293b', borderWidth: 2 },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.35)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
              ]
            }
          }
        }
      ]
    };
  }, [filteredReports]);

  const reasonOption = useMemo(() => {
    const latest = filteredReports[filteredReports.length - 1];
    const data = latest ? latest.reasonDistribution : [];
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899'];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
        formatter: '{b}: {c}件 ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: '#94a3b8', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12,
        itemGap: 10
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: '#1e293b', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff' }
          },
          data: data.map((item, idx) => ({
            value: item.count,
            name: item.reason,
            itemStyle: { color: colors[idx % colors.length] }
          }))
        }
      ]
    };
  }, [filteredReports]);

  const categoryOption = useMemo(() => {
    const latest = filteredReports[filteredReports.length - 1];
    const data = latest ? latest.categoryReturnRate : [];

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown[]) => {
          const p = params[0] as { name: string; value: number };
          return `${p.name}<br/>退货率: <span style="color:#10b981;font-weight:bold">${(p.value * 100).toFixed(2)}%</span>`;
        }
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.category),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
          formatter: (val: number) => `${(val * 100).toFixed(1)}%`
        },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
      },
      series: [
        {
          type: 'bar',
          data: data.map((d) => d.rate),
          barWidth: '50%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#10b981' },
                { offset: 1, color: '#059669' }
              ]
            }
          }
        }
      ]
    };
  }, [filteredReports]);

  const logisticsOption = useMemo(() => {
    const couriers = mockData.couriers;
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
        axisPointer: { type: 'shadow' }
      },
      legend: {
        data: ['效率评分', '成本评分', '综合评分'],
        textStyle: { color: '#94a3b8', fontSize: 12 },
        top: 0
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: couriers.map((c) => c.name),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLine: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
      },
      series: [
        {
          name: '效率评分',
          type: 'bar',
          data: couriers.map((c) => c.efficiencyScore),
          barWidth: '22%',
          itemStyle: { borderRadius: [4, 4, 0, 0], color: '#3b82f6' }
        },
        {
          name: '成本评分',
          type: 'bar',
          data: couriers.map((c) => c.costScore),
          barWidth: '22%',
          itemStyle: { borderRadius: [4, 4, 0, 0], color: '#f59e0b' }
        },
        {
          name: '综合评分',
          type: 'bar',
          data: couriers.map((c) => c.overallScore),
          barWidth: '22%',
          itemStyle: { borderRadius: [4, 4, 0, 0], color: '#10b981' }
        }
      ]
    };
  }, []);

  const handleExportExcel = async () => {
    setExporting('excel');
    await exportReportsExcel();
    setExporting(null);
  };

  const handleExportPdf = async () => {
    setExporting('pdf');
    await downloadReportPdf();
    setExporting(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">统计报表中心</h1>
          <p className="mt-1 text-sm text-slate-400">退货数据分析与物流成本统计</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 rounded-lg border border-dark-700 bg-dark-800 px-3 py-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent text-sm text-slate-200 outline-none"
            />
            <span className="text-slate-500">-</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-transparent text-sm text-slate-200 outline-none"
            />
          </div>
          <button
            onClick={handleExportExcel}
            disabled={exporting !== null}
            className={cn(
              'btn-secondary flex items-center gap-2',
              exporting === 'excel' && 'cursor-not-allowed opacity-60'
            )}
          >
            {exporting === 'excel' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            导出Excel
          </button>
          <button
            onClick={handleExportPdf}
            disabled={exporting !== null}
            className={cn(
              'btn-primary flex items-center gap-2',
              exporting === 'pdf' && 'cursor-not-allowed opacity-60'
            )}
          >
            {exporting === 'pdf' ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            导出PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KPICard
          title="退货申请总数"
          value={summary.totalReturns.toLocaleString()}
          icon={Package}
          gradient="blue"
          subtitle="统计周期内"
          trend={{ direction: 'up', value: '12.5%', label: '较上期' }}
        />
        <KPICard
          title="平均退货率"
          value={`${(summary.avgReturnRate * 100).toFixed(2)}%`}
          icon={TrendingUp}
          gradient="purple"
          subtitle="全品类平均"
          trend={{ direction: 'down', value: '0.8%', label: '较上期' }}
        />
        <KPICard
          title="审批通过率"
          value={`${(summary.avgApprovedRate * 100).toFixed(1)}%`}
          icon={CheckCircle}
          gradient="emerald"
          subtitle="退货申请通过率"
        />
        <KPICard
          title="平均处理时长"
          value={`${summary.avgProcessingHours.toFixed(1)}h`}
          icon={Clock}
          gradient="orange"
          subtitle="单均处理小时数"
          trend={{ direction: 'down', value: '3.2h', label: '较上期' }}
        />
        <KPICard
          title="退款总金额"
          value={`¥${(summary.totalRefund / 10000).toFixed(1)}万`}
          icon={DollarSign}
          gradient="cyan"
          subtitle="统计周期内累计"
        />
        <KPICard
          title="物流总成本"
          value={`¥${(summary.totalLogisticsCost / 10000).toFixed(2)}万`}
          icon={Truck}
          gradient="orange"
          subtitle="逆向物流支出"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-white">退货率趋势</h3>
              <p className="text-xs text-slate-500">近30天退货率变化趋势</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1">
              <TrendingUp className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-blue-400">实时数据</span>
            </div>
          </div>
          <ReactECharts option={trendOption} style={{ height: 280 }} />
        </div>

        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-white">退货原因分布</h3>
              <p className="text-xs text-slate-500">最新一日退货原因占比</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
              <AlertCircle className="h-3 w-3 text-emerald-400" />
              <span className="text-xs text-emerald-400">已更新</span>
            </div>
          </div>
          <ReactECharts option={reasonOption} style={{ height: 280 }} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <div className="mb-4">
            <h3 className="font-display text-base font-semibold text-white">品类退货率对比</h3>
            <p className="text-xs text-slate-500">各商品分类退货率对比分析</p>
          </div>
          <ReactECharts option={categoryOption} style={{ height: 300 }} />
        </div>

        <div className="glass-card p-5">
          <div className="mb-4">
            <h3 className="font-display text-base font-semibold text-white">逆向物流成本分析</h3>
            <p className="text-xs text-slate-500">快递公司评分与成本对比</p>
          </div>
          <ReactECharts option={logisticsOption} style={{ height: 300 }} />
        </div>
      </div>
    </div>
  );
}
