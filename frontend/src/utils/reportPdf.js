import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CAMPUS_MAP, formatWasteCategory } from './constants';
import { formatReportRange, reportTypeLabel } from './reportDates';

export function downloadWasteReportPdf({
  title,
  reportType = 'custom',
  dateFrom,
  dateTo,
  summary,
  generatedBy = '',
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = 16;

  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Campus Eye', margin, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Waste Detection Report', margin, 18);
  doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth - margin, 18, { align: 'right' });

  y = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title || 'Waste Detection Report', margin, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  const meta = [
    `Report type: ${reportTypeLabel(reportType)}`,
    `Period: ${formatReportRange(dateFrom, dateTo)}`,
    `Campus: ${CAMPUS_MAP.name}`,
    generatedBy ? `Prepared by: ${generatedBy}` : null,
  ].filter(Boolean);
  meta.forEach((line) => {
    doc.text(line, margin, y);
    y += 5;
  });

  y += 4;
  const stats = [
    ['Total detections', String(summary?.total_detections ?? 0)],
    ['Hotspots', String(summary?.hotspots ?? 0)],
    ['Avg confidence', `${summary?.avg_confidence ?? 0}%`],
    ['Categories found', String(summary?.categories?.length ?? 0)],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Summary metric', 'Value']],
    body: stats,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [34, 197, 94], textColor: 255 },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 8;

  if (summary?.categories?.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('Breakdown by category', margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Category', 'Count']],
      body: summary.categories.map((c) => [
        formatWasteCategory(c.waste_category),
        String(c.count),
      ]),
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [22, 101, 52] },
      margin: { left: margin, right: margin },
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Waste detection details', margin, y);
  y += 2;

  const rows = (summary?.detections || []).map((d) => [
    String(d.id),
    formatWasteCategory(d.waste_category),
    `${Number(d.latitude).toFixed(5)}, ${Number(d.longitude).toFixed(5)}`,
    `${d.confidence_score}%`,
    `${d.detection_date} ${d.detection_time || ''}`.trim(),
    d.zone_name || '—',
    d.status || '—',
    d.is_hotspot ? 'Yes' : 'No',
    (d.description || '—').slice(0, 60),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Category', 'Coordinates', 'Conf.', 'Date/Time', 'Zone', 'Status', 'Hotspot', 'Description']],
    body: rows.length ? rows : [['—', 'No detections in this period', '', '', '', '', '', '', '']],
    theme: 'striped',
    styles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak' },
    headStyles: { fillColor: [21, 128, 61], fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 10 },
      2: { cellWidth: 28 },
      8: { cellWidth: 32 },
    },
    margin: { left: margin, right: margin },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Campus Eye — Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  const safeName = (title || 'waste_report').replace(/[^\w\-]+/g, '_').slice(0, 60);
  doc.save(`${safeName}.pdf`);
}
