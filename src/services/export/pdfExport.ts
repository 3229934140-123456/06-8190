import jsPDF from 'jspdf';
import type {
  ReportData,
  ReasonDistribution,
  CategoryReturnRate,
  Courier,
  ReturnRequest,
  LogisticsOrder,
  InspectionRecord,
  RefundRecord,
} from '@/types';
import { mockData } from '../mock/data';

export interface PdfExportOptions {
  title?: string;
  includeCharts?: boolean;
  includeSummary?: boolean;
  includeReasonDistribution?: boolean;
  includeLogisticsCost?: boolean;
}

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function formatNumber(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

function formatPercent(num: number, decimals: number = 2): string {
  return (num * 100).toFixed(decimals) + '%';
}

function formatCurrency(num: number): string {
  return '¥' + num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string): string {
  return dateStr;
}

function drawLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number): void {
  doc.setLineWidth(0.2);
  doc.line(x1, y1, x2, y2);
}

function drawDashedLine(doc: jsPDF, x1: number, y1: number, x2: number, y2: number): void {
  doc.setLineDashPattern([2, 2], 0);
  doc.setLineWidth(0.1);
  doc.line(x1, y1, x2, y2);
  doc.setLineDashPattern([], 0);
}

function drawHeader(doc: jsPDF, title: string, page: number, totalPages: number): number {
  let y = MARGIN;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text(`生成时间: ${new Date().toLocaleString('zh-CN')}`, MARGIN, y);
  doc.text(`第 ${page} / ${totalPages} 页`, PAGE_WIDTH - MARGIN, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  y += 8;
  drawLine(doc, MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;

  return y;
}

function drawFooter(doc: jsPDF): void {
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  drawDashedLine(doc, MARGIN, PAGE_HEIGHT - 15, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 15);
  doc.text('退货管理系统 - 数据分析报告', MARGIN, PAGE_HEIGHT - 8);
  doc.text('© 2026 After-Sales Management System', PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 8, {
    align: 'right',
  });
  doc.setTextColor(0, 0, 0);
}

function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(title, MARGIN, y);
  doc.setTextColor(0, 0, 0);
  y += 6;
  drawLine(doc, MARGIN, y, MARGIN + 40, y);
  y += 8;
  return y;
}

function drawLabelValue(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number
): void {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(label, x, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(value, x, y + 5);
  doc.setTextColor(0, 0, 0);
}

function drawSummarySection(doc: jsPDF, reports: ReportData[], y: number): number {
  y = drawSectionTitle(doc, '数据概览', y);

  const latest = reports[reports.length - 1];
  const totalReturns = reports.reduce((sum, r) => sum + r.totalReturns, 0);
  const avgReturnRate = reports.reduce((sum, r) => sum + r.returnRate, 0) / reports.length;
  const avgApprovedRate = reports.reduce((sum, r) => sum + r.approvedRate, 0) / reports.length;
  const totalRefund = reports.reduce((sum, r) => sum + r.refundTotalAmount, 0);
  const totalLogisticsCost = reports.reduce((sum, r) => sum + r.logisticsTotalCost, 0);
  const avgProcessingHours =
    reports.reduce((sum, r) => sum + r.averageProcessingHours, 0) / reports.length;

  const colWidth = CONTENT_WIDTH / 3;

  drawLabelValue(doc, '退货申请总数', String(totalReturns), MARGIN, y);
  drawLabelValue(
    doc,
    '平均退货率',
    formatPercent(avgReturnRate),
    MARGIN + colWidth,
    y
  );
  drawLabelValue(
    doc,
    '平均审批通过率',
    formatPercent(avgApprovedRate),
    MARGIN + colWidth * 2,
    y
  );
  y += 15;

  drawLabelValue(doc, '退款总金额', formatCurrency(totalRefund), MARGIN, y);
  drawLabelValue(
    doc,
    '物流总成本',
    formatCurrency(totalLogisticsCost),
    MARGIN + colWidth,
    y
  );
  drawLabelValue(
    doc,
    '平均处理时长(小时)',
    formatNumber(avgProcessingHours, 1),
    MARGIN + colWidth * 2,
    y
  );
  y += 15;

  if (latest) {
    drawLabelValue(doc, '统计周期', `${reports[0].date} ~ ${latest.date}`, MARGIN, y);
  }

  y += 15;
  return y;
}

function drawTrendChart(
  doc: jsPDF,
  reports: ReportData[],
  y: number,
  title: string
): number {
  y = drawSectionTitle(doc, title, y);

  const chartWidth = CONTENT_WIDTH;
  const chartHeight = 70;
  const chartX = MARGIN;
  const chartY = y;
  const padding = { top: 15, right: 10, bottom: 20, left: 30 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(chartX, chartY, chartWidth, chartHeight, 2, 2, 'FD');

  const maxRate = Math.max(...reports.map((r) => r.returnRate)) * 1.2;
  const minRate = 0;
  const step = reports.length > 1 ? plotWidth / (reports.length - 1) : plotWidth;

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  for (let i = 0; i <= 4; i++) {
    const value = minRate + ((maxRate - minRate) * i) / 4;
    const yPos = chartY + padding.top + plotHeight - (plotHeight * i) / 4;
    doc.text(formatPercent(value, 1), chartX + padding.left - 3, yPos + 2, { align: 'right' });
    drawDashedLine(
      doc,
      chartX + padding.left,
      yPos,
      chartX + padding.left + plotWidth,
      yPos
    );
  }

  const points: { x: number; y: number }[] = reports.map((r, i) => ({
    x: chartX + padding.left + i * step,
    y:
      chartY +
      padding.top +
      plotHeight -
      ((r.returnRate - minRate) / (maxRate - minRate)) * plotHeight,
  }));

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(1.2);
  for (let i = 1; i < points.length; i++) {
    doc.line(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }

  doc.setFillColor(30, 64, 175);
  points.forEach((p) => {
    doc.circle(p.x, p.y, 1.5, 'F');
  });

  doc.setTextColor(100, 100, 100);
  const labelCount = Math.min(reports.length, 6);
  const labelStep = Math.max(1, Math.floor(reports.length / labelCount));
  for (let i = 0; i < reports.length; i += labelStep) {
    doc.text(
      reports[i].date.slice(5),
      chartX + padding.left + i * step,
      chartY + padding.top + plotHeight + 10,
      { align: 'center' }
    );
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('退货率趋势 (%)', chartX + padding.left, chartY + padding.top - 4);
  doc.setTextColor(0, 0, 0);

  return y + chartHeight + 10;
}

function drawReasonDistributionChart(
  doc: jsPDF,
  reasons: ReasonDistribution[],
  y: number,
  title: string
): number {
  y = drawSectionTitle(doc, title, y);

  const total = reasons.reduce((sum, r) => sum + r.count, 0);
  const sorted = [...reasons].sort((a, b) => b.count - a.count);

  const colors = [
    [30, 64, 175],
    [59, 130, 246],
    [14, 165, 233],
    [20, 184, 166],
    [34, 197, 94],
    [234, 179, 8],
    [249, 115, 22],
    [239, 68, 68],
  ];

  const barHeight = 8;
  const barGap = 6;
  const labelWidth = 70;
  const valueWidth = 40;
  const maxBarWidth = CONTENT_WIDTH - labelWidth - valueWidth - 15;

  const maxCount = Math.max(...sorted.map((r) => r.count));

  sorted.forEach((reason, i) => {
    const rowY = y + i * (barHeight + barGap);
    const percent = (reason.count / total) * 100;
    const barWidth = (reason.count / maxCount) * maxBarWidth;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(reason.reason, MARGIN, rowY + barHeight - 2);

    const color = colors[i % colors.length];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(MARGIN + labelWidth, rowY, barWidth, barHeight, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(
      `${reason.count}件 (${percent.toFixed(1)}%)`,
      MARGIN + labelWidth + barWidth + 5,
      rowY + barHeight - 2
    );
  });

  return y + sorted.length * (barHeight + barGap) + 10;
}

function drawLogisticsCostAnalysis(
  doc: jsPDF,
  reports: ReportData[],
  couriers: Courier[],
  y: number,
  title: string
): number {
  y = drawSectionTitle(doc, title, y);

  const tableHeaders = ['快递公司', '平均时效(天)', '平均成本(元)', '效率评分', '成本评分', '综合评分'];
  const colWidths = [35, 25, 25, 22, 22, 22];

  let colX = MARGIN;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(240, 244, 255);
  tableHeaders.forEach((header, i) => {
    doc.roundedRect(colX, y, colWidths[i], 10, 1, 1, 'F');
    doc.setTextColor(30, 64, 175);
    doc.text(header, colX + 3, y + 7);
    colX += colWidths[i];
  });
  y += 12;

  doc.setFont('helvetica', 'normal');
  const sortedCouriers = [...couriers].sort((a, b) => b.overallScore - a.overallScore);
  sortedCouriers.forEach((courier, i) => {
    colX = MARGIN;
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      const totalWidth = colWidths.reduce((a, b) => a + b, 0);
      doc.rect(MARGIN, y - 3, totalWidth, 10, 'F');
    }

    doc.setTextColor(60, 60, 60);
    doc.text(courier.name, colX + 3, y + 4);
    colX += colWidths[0];

    doc.setTextColor(0, 0, 0);
    doc.text(formatNumber(courier.avgDeliveryDays, 1), colX + 3, y + 4);
    colX += colWidths[1];

    doc.text(formatCurrency(courier.avgCost), colX + 3, y + 4);
    colX += colWidths[2];

    doc.setTextColor(courier.efficiencyScore >= 85 ? 34 : courier.efficiencyScore >= 70 ? 245 : 239,
      courier.efficiencyScore >= 85 ? 197 : courier.efficiencyScore >= 70 ? 158 : 68,
      courier.efficiencyScore >= 85 ? 94 : courier.efficiencyScore >= 70 ? 11 : 68);
    doc.text(String(courier.efficiencyScore), colX + 3, y + 4);
    colX += colWidths[3];

    doc.setTextColor(courier.costScore >= 85 ? 34 : courier.costScore >= 70 ? 245 : 239,
      courier.costScore >= 85 ? 197 : courier.costScore >= 70 ? 158 : 68,
      courier.costScore >= 85 ? 94 : courier.costScore >= 70 ? 11 : 68);
    doc.text(String(courier.costScore), colX + 3, y + 4);
    colX += colWidths[4];

    doc.setTextColor(courier.overallScore >= 85 ? 34 : courier.overallScore >= 70 ? 245 : 239,
      courier.overallScore >= 85 ? 197 : courier.overallScore >= 70 ? 158 : 68,
      courier.overallScore >= 85 ? 94 : courier.overallScore >= 70 ? 11 : 68);
    doc.setFont('helvetica', 'bold');
    doc.text(String(courier.overallScore), colX + 3, y + 4);
    doc.setFont('helvetica', 'normal');
    colX += colWidths[5];

    y += 10;
  });

  y += 8;

  const latest = reports[reports.length - 1];
  const totalCost = reports.reduce((sum, r) => sum + r.logisticsTotalCost, 0);
  const avgCost = totalCost / reports.length;

  const colWidth2 = CONTENT_WIDTH / 2;
  drawLabelValue(doc, '周期物流总成本', formatCurrency(totalCost), MARGIN, y);
  drawLabelValue(doc, '日均物流成本', formatCurrency(avgCost), MARGIN + colWidth2, y);
  y += 10;

  if (latest) {
    drawLabelValue(doc, '最新日物流成本', formatCurrency(latest.logisticsTotalCost), MARGIN, y);
    drawLabelValue(
      doc,
      '快递公司数量',
      String(couriers.length) + '家',
      MARGIN + colWidth2,
      y
    );
  }

  y += 15;
  return y;
}

function calculateTotalPages(reports: ReportData[], options: PdfExportOptions): number {
  let pages = 1;
  let y = MARGIN + 30;

  if (options.includeSummary) {
    y += 60;
  }

  if (options.includeCharts) {
    y += 95;
    if (y > PAGE_HEIGHT - 30) {
      pages++;
      y = MARGIN + 30;
    }
  }

  if (options.includeReasonDistribution) {
    y += 90;
    if (y > PAGE_HEIGHT - 30) {
      pages++;
      y = MARGIN + 30;
    }
  }

  if (options.includeLogisticsCost) {
    y += 140;
    if (y > PAGE_HEIGHT - 30) {
      pages++;
    }
  }

  return pages;
}

export async function generateReportPdf(
  reports?: ReportData[],
  options: PdfExportOptions = {}
): Promise<Blob> {
  const mergedOptions: PdfExportOptions = {
    title: '退货数据分析报告',
    includeCharts: true,
    includeSummary: true,
    includeReasonDistribution: true,
    includeLogisticsCost: true,
    ...options,
  };

  const reportData = reports || mockData.reports;
  const couriers = mockData.couriers;

  const totalPages = calculateTotalPages(reportData, mergedOptions);

  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  });

  let currentPage = 1;
  let y = drawHeader(doc, mergedOptions.title || '退货数据分析报告', currentPage, totalPages);

  if (mergedOptions.includeSummary) {
    if (y > PAGE_HEIGHT - 100) {
      drawFooter(doc);
      doc.addPage();
      currentPage++;
      y = drawHeader(doc, mergedOptions.title || '退货数据分析报告', currentPage, totalPages);
    }
    y = drawSummarySection(doc, reportData, y);
  }

  if (mergedOptions.includeCharts && reportData.length > 0) {
    if (y > PAGE_HEIGHT - 120) {
      drawFooter(doc);
      doc.addPage();
      currentPage++;
      y = drawHeader(doc, mergedOptions.title || '退货数据分析报告', currentPage, totalPages);
    }
    y = drawTrendChart(doc, reportData, y, '退货率趋势分析');
  }

  if (mergedOptions.includeReasonDistribution && reportData.length > 0) {
    const latestReport = reportData[reportData.length - 1];
    if (latestReport && latestReport.reasonDistribution.length > 0) {
      if (y > PAGE_HEIGHT - 110) {
        drawFooter(doc);
        doc.addPage();
        currentPage++;
        y = drawHeader(doc, mergedOptions.title || '退货数据分析报告', currentPage, totalPages);
      }
      y = drawReasonDistributionChart(
        doc,
        latestReport.reasonDistribution,
        y,
        '退货原因分布'
      );
    }
  }

  if (mergedOptions.includeLogisticsCost) {
    if (y > PAGE_HEIGHT - 170) {
      drawFooter(doc);
      doc.addPage();
      currentPage++;
      y = drawHeader(doc, mergedOptions.title || '退货数据分析报告', currentPage, totalPages);
    }
    y = drawLogisticsCostAnalysis(doc, reportData, couriers, y, '物流成本分析');
  }

  drawFooter(doc);

  return doc.output('blob');
}

export async function downloadReportPdf(
  filename?: string,
  reports?: ReportData[],
  options?: PdfExportOptions
): Promise<void> {
  const blob = await generateReportPdf(reports, options);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `退货数据分析报告_${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function generateReturnDetailPdf(
  returnRequest: ReturnRequest,
  logisticsOrder?: LogisticsOrder,
  inspectionRecord?: InspectionRecord,
  refundRecord?: RefundRecord
): Promise<Blob> {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait',
  });

  let y = drawHeader(doc, `退货单详情 - ${returnRequest.id}`, 1, 1);

  y = drawSectionTitle(doc, '基本信息', y);

  const colWidth = CONTENT_WIDTH / 2;
  drawLabelValue(doc, '退货单号', returnRequest.id, MARGIN, y);
  drawLabelValue(doc, '订单号', returnRequest.orderId, MARGIN + colWidth, y);
  y += 15;

  drawLabelValue(doc, '商品名称', returnRequest.productName, MARGIN, y);
  drawLabelValue(doc, '商品分类', returnRequest.productCategory, MARGIN + colWidth, y);
  y += 15;

  drawLabelValue(doc, '商品价格', formatCurrency(returnRequest.productPrice), MARGIN, y);
  drawLabelValue(doc, '退款金额', formatCurrency(returnRequest.refundAmount), MARGIN + colWidth, y);
  y += 15;

  drawLabelValue(doc, '客户姓名', returnRequest.customerName, MARGIN, y);
  drawLabelValue(doc, '客户等级', returnRequest.customerLevel, MARGIN + colWidth, y);
  y += 15;

  drawLabelValue(doc, '退货原因', returnRequest.returnReason, MARGIN, y);
  drawLabelValue(doc, '退货类型', returnRequest.returnType, MARGIN + colWidth, y);
  y += 15;

  drawLabelValue(doc, '当前状态', returnRequest.status, MARGIN, y);
  drawLabelValue(doc, '申请时间', formatDate(returnRequest.createdAt), MARGIN + colWidth, y);
  y += 20;

  if (logisticsOrder) {
    y = drawSectionTitle(doc, '物流信息', y);
    drawLabelValue(doc, '物流单号', logisticsOrder.id, MARGIN, y);
    drawLabelValue(doc, '快递公司', logisticsOrder.courierName, MARGIN + colWidth, y);
    y += 15;
    drawLabelValue(doc, '运单号', logisticsOrder.trackingNumber, MARGIN, y);
    drawLabelValue(doc, '物流状态', logisticsOrder.status, MARGIN + colWidth, y);
    y += 15;
    drawLabelValue(
      doc,
      '物流成本',
      formatCurrency(logisticsOrder.actualCost || logisticsOrder.estimatedCost),
      MARGIN,
      y
    );
    drawLabelValue(
      doc,
      '运输天数',
      logisticsOrder.actualDays ? `${logisticsOrder.actualDays}天` : `预计${logisticsOrder.estimatedDays}天`,
      MARGIN + colWidth,
      y
    );
    y += 20;
  }

  if (inspectionRecord) {
    y = drawSectionTitle(doc, '验收信息', y);
    drawLabelValue(doc, '验收单号', inspectionRecord.id, MARGIN, y);
    drawLabelValue(doc, '验收人', inspectionRecord.inspector, MARGIN + colWidth, y);
    y += 15;
    drawLabelValue(doc, '验收结果', inspectionRecord.inspectionResult, MARGIN, y);
    drawLabelValue(doc, '损坏程度', inspectionRecord.damageLevel, MARGIN + colWidth, y);
    y += 15;
    if (inspectionRecord.damageDescription) {
      drawLabelValue(doc, '损坏描述', inspectionRecord.damageDescription, MARGIN, y);
      y += 15;
    }
    drawLabelValue(doc, '验收时间', formatDate(inspectionRecord.inspectedAt), MARGIN, y);
    y += 20;
  }

  if (refundRecord) {
    y = drawSectionTitle(doc, '退款信息', y);
    drawLabelValue(doc, '退款单号', refundRecord.id, MARGIN, y);
    drawLabelValue(doc, '退款状态', refundRecord.status, MARGIN + colWidth, y);
    y += 15;
    drawLabelValue(doc, '原支付方式', refundRecord.originalPaymentMethod, MARGIN, y);
    drawLabelValue(doc, '退款方式', refundRecord.refundMethod, MARGIN + colWidth, y);
    y += 15;
    drawLabelValue(
      doc,
      '退款金额',
      formatCurrency(refundRecord.refundAmount),
      MARGIN,
      y
    );
    if (refundRecord.pointsAmount > 0) {
      drawLabelValue(
        doc,
        '积分补偿',
        `${refundRecord.pointsAmount}积分`,
        MARGIN + colWidth,
        y
      );
    }
    y += 15;
    drawLabelValue(doc, '交易流水号', refundRecord.transactionId, MARGIN, y);
    drawLabelValue(doc, '处理时间', formatDate(refundRecord.processedAt), MARGIN + colWidth, y);
    y += 20;
  }

  if (returnRequest.timeline && returnRequest.timeline.length > 0) {
    y = drawSectionTitle(doc, '处理时间线', y);
    returnRequest.timeline.forEach((event) => {
      if (y > PAGE_HEIGHT - 30) {
        drawFooter(doc);
        doc.addPage();
        y = drawHeader(doc, `退货单详情 - ${returnRequest.id}`, 1, 1);
        y = drawSectionTitle(doc, '处理时间线(续)', y);
      }
      doc.setFillColor(30, 64, 175);
      doc.circle(MARGIN + 3, y + 2, 2, 'F');
      drawLine(doc, MARGIN + 3, y + 4, MARGIN + 3, y + 12);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 64, 175);
      doc.text(event.status, MARGIN + 10, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`${event.operator} - ${formatDate(event.timestamp)}`, MARGIN + 10, y + 10);
      doc.setTextColor(60, 60, 60);
      if (event.remark) {
        doc.text(event.remark, MARGIN + 10, y + 16);
        y += 22;
      } else {
        y += 16;
      }
      doc.setTextColor(0, 0, 0);
    });
  }

  drawFooter(doc);

  return doc.output('blob');
}

export async function downloadReturnDetailPdf(
  returnRequest: ReturnRequest,
  logisticsOrder?: LogisticsOrder,
  inspectionRecord?: InspectionRecord,
  refundRecord?: RefundRecord,
  filename?: string
): Promise<void> {
  const blob = await generateReturnDetailPdf(
    returnRequest,
    logisticsOrder,
    inspectionRecord,
    refundRecord
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `退货单_${returnRequest.id}_详情.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
