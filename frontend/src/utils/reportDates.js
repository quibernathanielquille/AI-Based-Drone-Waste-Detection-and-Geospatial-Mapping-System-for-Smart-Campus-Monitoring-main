export function todayIso() {
  const d = new Date();
  return formatLocalDate(d);
}

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function computeReportRange(reportType, referenceDate) {
  const ref = referenceDate || todayIso();

  switch (reportType) {
    case 'daily':
      return { date_from: ref, date_to: ref, reference_date: ref };
    case 'weekly': {
      const end = new Date(`${ref}T12:00:00`);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      return {
        date_from: formatLocalDate(start),
        date_to: ref,
        reference_date: ref,
      };
    }
    case 'monthly': {
      const d = new Date(`${ref}T12:00:00`);
      const from = new Date(d.getFullYear(), d.getMonth(), 1);
      const to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      return { date_from: formatLocalDate(from), date_to: formatLocalDate(to), reference_date: ref };
    }
    default:
      return { date_from: ref, date_to: ref, reference_date: ref };
  }
}

export function reportTypeLabel(type) {
  return { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', custom: 'Custom' }[type] || type;
}

export function formatReportRange(dateFrom, dateTo) {
  if (!dateFrom && !dateTo) return '—';
  if (dateFrom === dateTo) return dateFrom;
  return `${dateFrom} — ${dateTo}`;
}
