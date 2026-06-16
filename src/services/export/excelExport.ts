import * as XLSX from 'xlsx';
import type {
  ReturnRequest,
  LogisticsOrder,
  InspectionRecord,
  RefundRecord,
  LiabilityTicket,
  Alert,
  OperationLog,
  ReportData,
  Courier,
} from '@/types';
import { mockData } from '../mock/data';
import {
  RETURN_STATUS_LABEL,
  LOGISTICS_STATUS_LABEL,
  INSPECTION_RESULT_LABEL,
  DAMAGE_LEVEL_LABEL,
  REFUND_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  REFUND_METHOD_LABEL,
  LIABILITY_PARTY_LABEL,
  TICKET_STATUS_LABEL,
  PRIORITY_LABEL,
  ALERT_TYPE_LABEL,
  ALERT_SEVERITY_LABEL,
  ALERT_STATUS_LABEL,
  CUSTOMER_LEVEL_LABEL,
  RETURN_TYPE_LABEL,
} from '@/types';

export interface ExcelSheetConfig<T> {
  name: string;
  headers: string[];
  data: T[];
  rowMapper: (item: T) => (string | number | boolean)[];
  columnWidths?: number[];
}

type AOA = (string | number | boolean)[][];

function createSheet<T>(config: ExcelSheetConfig<T>): XLSX.WorkSheet {
  const aoa: AOA = [config.headers, ...config.data.map(config.rowMapper)];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  if (config.columnWidths) {
    ws['!cols'] = config.columnWidths.map((w) => ({ wch: w }));
  }

  return ws;
}

function downloadWorkbook(wb: XLSX.WorkBook, filename: string): void {
  XLSX.writeFile(wb, filename);
}

function formatCurrency(num: number): string {
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(num: number, decimals: number = 2): string {
  return (num * 100).toFixed(decimals) + '%';
}

function formatDate(dateStr: string): string {
  return dateStr;
}

export function generateReturnRequestsSheet(
  data: ReturnRequest[] = mockData.returnRequests
): ExcelSheetConfig<ReturnRequest> {
  return {
    name: '退货申请列表',
    headers: [
      '退货单号',
      '订单号',
      '订单日期',
      '商品ID',
      '商品名称',
      '商品分类',
      '商品价格(元)',
      '客户ID',
      '客户姓名',
      '客户等级',
      '退货原因',
      '退货类型',
      '是否在保',
      '折旧率',
      '折旧金额(元)',
      '退款金额(元)',
      '当前状态',
      '创建时间',
      '更新时间',
    ],
    data,
    rowMapper: (item) => [
      item.id,
      item.orderId,
      formatDate(item.orderDate),
      item.productId,
      item.productName,
      item.productCategory,
      formatCurrency(item.productPrice),
      item.customerId,
      item.customerName,
      CUSTOMER_LEVEL_LABEL[item.customerLevel],
      item.returnReason,
      RETURN_TYPE_LABEL[item.returnType],
      item.inWarranty ? '是' : '否',
      formatPercent(item.depreciationRate),
      formatCurrency(item.depreciationAmount),
      formatCurrency(item.refundAmount),
      RETURN_STATUS_LABEL[item.status],
      formatDate(item.createdAt),
      formatDate(item.updatedAt),
    ],
    columnWidths: [
      14, 14, 20, 12, 28, 12, 12, 12, 12, 10,
      14, 10, 8, 8, 12, 12, 14, 20, 20,
    ],
  };
}

export function generateLogisticsOrdersSheet(
  data: LogisticsOrder[] = mockData.logisticsOrders
): ExcelSheetConfig<LogisticsOrder> {
  return {
    name: '物流单列表',
    headers: [
      '物流单号',
      '关联退货单',
      '关联订单号',
      '快递ID',
      '快递公司',
      '运单号',
      '预估费用(元)',
      '实际费用(元)',
      '预估天数',
      '实际天数',
      '物流状态',
      '创建时间',
    ],
    data,
    rowMapper: (item) => [
      item.id,
      item.returnId,
      item.orderId,
      item.courierId,
      item.courierName,
      item.trackingNumber,
      formatCurrency(item.estimatedCost),
      item.actualCost > 0 ? formatCurrency(item.actualCost) : '-',
      item.estimatedDays,
      item.actualDays > 0 ? item.actualDays : '-',
      LOGISTICS_STATUS_LABEL[item.status],
      formatDate(item.createdAt),
    ],
    columnWidths: [14, 14, 14, 10, 12, 20, 12, 12, 10, 10, 10, 20],
  };
}

export function generateInspectionRecordsSheet(
  data: InspectionRecord[] = mockData.inspectionRecords
): ExcelSheetConfig<InspectionRecord> {
  return {
    name: '验收记录列表',
    headers: [
      '验收单号',
      '关联退货单',
      '验收人',
      '验收结果',
      '损坏程度',
      '损坏描述',
      '收货数量',
      '验收时间',
    ],
    data,
    rowMapper: (item) => [
      item.id,
      item.returnId,
      item.inspector,
      INSPECTION_RESULT_LABEL[item.inspectionResult],
      DAMAGE_LEVEL_LABEL[item.damageLevel],
      item.damageDescription,
      item.receivedQuantity,
      formatDate(item.inspectedAt),
    ],
    columnWidths: [14, 14, 12, 10, 10, 40, 10, 20],
  };
}

export function generateRefundRecordsSheet(
  data: RefundRecord[] = mockData.refundRecords
): ExcelSheetConfig<RefundRecord> {
  return {
    name: '退款记录列表',
    headers: [
      '退款单号',
      '关联退货单',
      '关联订单号',
      '原支付方式',
      '退款方式',
      '退款金额(元)',
      '积分补偿',
      '退款状态',
      '交易流水号',
      '处理时间',
    ],
    data,
    rowMapper: (item) => [
      item.id,
      item.returnId,
      item.orderId,
      PAYMENT_METHOD_LABEL[item.originalPaymentMethod],
      REFUND_METHOD_LABEL[item.refundMethod],
      formatCurrency(item.refundAmount),
      item.pointsAmount > 0 ? `${item.pointsAmount}积分` : '-',
      REFUND_STATUS_LABEL[item.status],
      item.transactionId,
      formatDate(item.processedAt),
    ],
    columnWidths: [14, 14, 14, 12, 12, 12, 12, 10, 24, 20],
  };
}

export function generateLiabilityTicketsSheet(
  data: LiabilityTicket[] = mockData.liabilityTickets
): ExcelSheetConfig<LiabilityTicket> {
  return {
    name: '责任工单列表',
    headers: [
      '工单号',
      '关联退货单',
      '关联订单号',
      '负责人',
      '责任方',
      '工单状态',
      '优先级',
      '问题描述',
      '解决方案',
      '创建时间',
      '解决时间',
    ],
    data,
    rowMapper: (item) => [
      item.id,
      item.returnId,
      item.orderId,
      item.assignee,
      LIABILITY_PARTY_LABEL[item.liabilityParty],
      TICKET_STATUS_LABEL[item.status],
      PRIORITY_LABEL[item.priority],
      item.description,
      item.resolution || '-',
      formatDate(item.createdAt),
      item.resolvedAt ? formatDate(item.resolvedAt) : '-',
    ],
    columnWidths: [14, 14, 14, 10, 12, 10, 8, 30, 30, 20, 20],
  };
}

export function generateAlertsSheet(
  data: Alert[] = mockData.alerts
): ExcelSheetConfig<Alert> {
  return {
    name: '告警记录列表',
    headers: [
      '告警ID',
      '告警类型',
      '严重程度',
      '标题',
      '描述',
      '关联ID',
      '状态',
      '创建时间',
    ],
    data,
    rowMapper: (item) => [
      item.id,
      ALERT_TYPE_LABEL[item.type],
      ALERT_SEVERITY_LABEL[item.severity],
      item.title,
      item.description,
      item.relatedId,
      ALERT_STATUS_LABEL[item.status],
      formatDate(item.createdAt),
    ],
    columnWidths: [14, 12, 10, 18, 36, 14, 10, 20],
  };
}

export function generateOperationLogsSheet(
  data: OperationLog[] = mockData.operationLogs
): ExcelSheetConfig<OperationLog> {
  return {
    name: '操作日志列表',
    headers: [
      '日志ID',
      '操作人',
      '操作类型',
      '所属模块',
      '目标ID',
      '操作详情',
      'IP地址',
      '操作时间',
    ],
    data,
    rowMapper: (item) => [
      item.id,
      item.operator,
      item.action,
      item.module,
      item.targetId,
      item.detail,
      item.ip,
      formatDate(item.createdAt),
    ],
    columnWidths: [16, 12, 14, 12, 14, 36, 14, 20],
  };
}

export function generateCouriersSheet(
  data: Courier[] = mockData.couriers
): ExcelSheetConfig<Courier> {
  return {
    name: '快递公司列表',
    headers: [
      '快递ID',
      '快递公司',
      '效率评分',
      '成本评分',
      '综合评分',
      '平均时效(天)',
      '平均成本(元)',
    ],
    data,
    rowMapper: (item) => [
      item.id,
      item.name,
      item.efficiencyScore,
      item.costScore,
      item.overallScore,
      item.avgDeliveryDays,
      formatCurrency(item.avgCost),
    ],
    columnWidths: [10, 14, 10, 10, 10, 12, 12],
  };
}

export function generateReportsSheet(
  data: ReportData[] = mockData.reports
): ExcelSheetConfig<ReportData> {
  return {
    name: '日报数据',
    headers: [
      '日期',
      '退货申请数',
      '退货率',
      '审批通过率',
      '平均处理时长(小时)',
      '退款总金额(元)',
      '物流总成本(元)',
    ],
    data,
    rowMapper: (item) => [
      item.date,
      item.totalReturns,
      formatPercent(item.returnRate),
      formatPercent(item.approvedRate),
      item.averageProcessingHours.toFixed(1),
      formatCurrency(item.refundTotalAmount),
      formatCurrency(item.logisticsTotalCost),
    ],
    columnWidths: [12, 12, 10, 12, 16, 14, 14],
  };
}

export function generateReasonDistributionSheet(
  data: ReportData[] = mockData.reports
): ExcelSheetConfig<{ date: string; reason: string; count: number }> {
  const flatData: { date: string; reason: string; count: number }[] = [];
  data.forEach((report) => {
    report.reasonDistribution.forEach((rd) => {
      flatData.push({
        date: report.date,
        reason: rd.reason,
        count: rd.count,
      });
    });
  });

  return {
    name: '退货原因分布',
    headers: ['日期', '退货原因', '数量'],
    data: flatData,
    rowMapper: (item) => [item.date, item.reason, item.count],
    columnWidths: [12, 16, 10],
  };
}

export function generateCategoryReturnRateSheet(
  data: ReportData[] = mockData.reports
): ExcelSheetConfig<{ date: string; category: string; rate: number }> {
  const flatData: { date: string; category: string; rate: number }[] = [];
  data.forEach((report) => {
    report.categoryReturnRate.forEach((cr) => {
      flatData.push({
        date: report.date,
        category: cr.category,
        rate: cr.rate,
      });
    });
  });

  return {
    name: '分类退货率',
    headers: ['日期', '商品分类', '退货率'],
    data: flatData,
    rowMapper: (item) => [item.date, item.category, formatPercent(item.rate)],
    columnWidths: [12, 12, 10],
  };
}

export function generateStatisticsSummarySheet(): ExcelSheetConfig<{
  metric: string;
  value: string;
}> {
  const returns = mockData.returnRequests;
  const reports = mockData.reports;
  const latestReport = reports[reports.length - 1];
  const totalReturns = returns.length;
  const pendingCount = returns.filter(
    (r) => r.status === 'pending_review' || r.status === 'reviewing'
  ).length;
  const totalRefund = reports.reduce((sum, r) => sum + r.refundTotalAmount, 0);
  const totalLogisticsCost = reports.reduce((sum, r) => sum + r.logisticsTotalCost, 0);
  const avgReturnRate = reports.reduce((sum, r) => sum + r.returnRate, 0) / reports.length;
  const avgApprovedRate =
    reports.reduce((sum, r) => sum + r.approvedRate, 0) / reports.length;
  const avgProcessingHours =
    reports.reduce((sum, r) => sum + r.averageProcessingHours, 0) / reports.length;
  const unreadAlertCount = mockData.alerts.filter((a) => a.status === 'unread').length;
  const pendingTicketCount = mockData.liabilityTickets.filter(
    (t) => t.status === 'pending' || t.status === 'processing'
  ).length;

  const summaryData = [
    { metric: '退货申请总数', value: String(totalReturns) },
    { metric: '待处理退货数', value: String(pendingCount) },
    { metric: '周期退款总金额', value: formatCurrency(totalRefund) },
    { metric: '周期物流总成本', value: formatCurrency(totalLogisticsCost) },
    { metric: '平均退货率', value: formatPercent(avgReturnRate) },
    { metric: '平均审批通过率', value: formatPercent(avgApprovedRate) },
    { metric: '平均处理时长(小时)', value: avgProcessingHours.toFixed(1) },
    { metric: '未读告警数', value: String(unreadAlertCount) },
    { metric: '待处理工单数', value: String(pendingTicketCount) },
    {
      metric: '统计周期',
      value:
        reports.length > 0
          ? `${reports[0].date} ~ ${latestReport?.date || ''}`
          : '-',
    },
  ];

  return {
    name: '数据概览',
    headers: ['指标', '数值'],
    data: summaryData,
    rowMapper: (item) => [item.metric, item.value],
    columnWidths: [24, 30],
  };
}

export interface ExportReturnsOptions {
  filename?: string;
  includeSheets?: (
    | 'summary'
    | 'returns'
    | 'logistics'
    | 'inspection'
    | 'refund'
    | 'tickets'
    | 'alerts'
    | 'logs'
  )[];
}

export async function exportReturnsExcel(
  options: ExportReturnsOptions = {}
): Promise<void> {
  const {
    filename = `退货数据_${new Date().toISOString().slice(0, 10)}.xlsx`,
    includeSheets = [
      'summary',
      'returns',
      'logistics',
      'inspection',
      'refund',
      'tickets',
      'alerts',
      'logs',
    ],
  } = options;

  const wb = XLSX.utils.book_new();

  if (includeSheets.includes('summary')) {
    const config = generateStatisticsSummarySheet();
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }
  if (includeSheets.includes('returns')) {
    const config = generateReturnRequestsSheet();
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }
  if (includeSheets.includes('logistics')) {
    const config = generateLogisticsOrdersSheet();
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }
  if (includeSheets.includes('inspection')) {
    const config = generateInspectionRecordsSheet();
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }
  if (includeSheets.includes('refund')) {
    const config = generateRefundRecordsSheet();
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }
  if (includeSheets.includes('tickets')) {
    const config = generateLiabilityTicketsSheet();
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }
  if (includeSheets.includes('alerts')) {
    const config = generateAlertsSheet();
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }
  if (includeSheets.includes('logs')) {
    const config = generateOperationLogsSheet();
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }

  downloadWorkbook(wb, filename);
}

export interface ExportReportsOptions {
  filename?: string;
  includeSheets?: (
    | 'summary'
    | 'daily'
    | 'reasons'
    | 'categories'
    | 'couriers'
  )[];
  reports?: ReportData[];
}

export async function exportReportsExcel(
  options: ExportReportsOptions = {}
): Promise<void> {
  const {
    filename = `统计报表_${new Date().toISOString().slice(0, 10)}.xlsx`,
    includeSheets = ['summary', 'daily', 'reasons', 'categories', 'couriers'],
    reports,
  } = options;

  const wb = XLSX.utils.book_new();

  if (includeSheets.includes('summary')) {
    const config = generateStatisticsSummarySheet();
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }
  if (includeSheets.includes('daily')) {
    const config = generateReportsSheet(reports);
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }
  if (includeSheets.includes('reasons')) {
    const config = generateReasonDistributionSheet(reports);
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }
  if (includeSheets.includes('categories')) {
    const config = generateCategoryReturnRateSheet(reports);
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }
  if (includeSheets.includes('couriers')) {
    const config = generateCouriersSheet();
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  }

  downloadWorkbook(wb, filename);
}

export interface ExportCustomOptions {
  filename?: string;
  sheets: ExcelSheetConfig<unknown>[];
}

export async function exportCustomExcel(
  options: ExportCustomOptions
): Promise<void> {
  const { filename = `导出数据_${new Date().toISOString().slice(0, 10)}.xlsx`, sheets } =
    options;

  const wb = XLSX.utils.book_new();

  sheets.forEach((config) => {
    XLSX.utils.book_append_sheet(wb, createSheet(config), config.name);
  });

  downloadWorkbook(wb, filename);
}

export function exportSingleSheet<T>(
  sheetConfig: ExcelSheetConfig<T>,
  filename?: string
): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, createSheet(sheetConfig), sheetConfig.name);
  downloadWorkbook(wb, filename || `${sheetConfig.name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function arrayToSheet<T>(
  data: T[],
  headers: string[],
  rowMapper: (item: T) => (string | number | boolean)[],
  sheetName: string = 'Sheet1'
): XLSX.WorkSheet {
  const config: ExcelSheetConfig<T> = {
    name: sheetName,
    headers,
    data,
    rowMapper,
  };
  return createSheet(config);
}
