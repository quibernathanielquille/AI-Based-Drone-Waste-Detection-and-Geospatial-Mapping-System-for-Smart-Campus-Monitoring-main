import { useEffect, useMemo, useState } from 'react';
import { reportService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { WASTE_CATEGORIES, WASTE_CATEGORY_LABELS } from '../utils/constants';
import {
  computeReportRange,
  formatReportRange,
  reportTypeLabel,
  todayIso,
} from '../utils/reportDates';
import { downloadWasteReportPdf } from '../utils/reportPdf';

const emptyForm = {
  report_type: 'weekly',
  reference_date: todayIso(),
  date_from: '',
  date_to: '',
  waste_category: '',
};

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ search: '', report_type: '', page: 1, sort: 'created_at', order: 'DESC' });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const range = useMemo(() => {
    if (form.report_type === 'custom') {
      return { date_from: form.date_from, date_to: form.date_to };
    }
    return computeReportRange(form.report_type, form.reference_date);
  }, [form]);

  const load = () => {
    setLoading(true);
    reportService.getAll(filters)
      .then((res) => {
        if (res.data.success) {
          setReports(res.data.data.items);
          setPagination(res.data.data.pagination);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters]);

  useEffect(() => {
    if (!showModal) return undefined;
    const t = setTimeout(() => {
      refreshPreview();
    }, 300);
    return () => clearTimeout(t);
  }, [showModal, form.report_type, form.reference_date, form.date_from, form.date_to, form.waste_category]);

  const buildPayload = () => ({
    report_type: form.report_type,
    reference_date: form.reference_date,
    date_from: form.report_type === 'custom' ? form.date_from : range.date_from,
    date_to: form.report_type === 'custom' ? form.date_to : range.date_to,
    waste_category: form.waste_category || undefined,
  });

  const refreshPreview = async () => {
    if (form.report_type === 'custom' && (!form.date_from || !form.date_to)) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    setError('');
    try {
      const res = await reportService.preview(buildPayload());
      if (res.data.success) setPreview(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not preview report');
    } finally {
      setPreviewLoading(false);
    }
  };

  const openCreateModal = () => {
    setForm(emptyForm);
    setPreview(null);
    setError('');
    setMessage('');
    setShowModal(true);
  };

  const handleCreateAndDownload = async () => {
    if (form.report_type === 'custom' && (!form.date_from || !form.date_to)) {
      setError('Please select both start and end dates.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const res = await reportService.generate({ ...buildPayload(), file_format: 'pdf' });
      if (!res.data.success) throw new Error('Generate failed');

      const { title, filters: savedFilters, summary } = res.data.data;
      downloadWasteReportPdf({
        title,
        reportType: form.report_type,
        dateFrom: savedFilters.date_from,
        dateTo: savedFilters.date_to,
        summary,
        generatedBy: `${user?.first_name || ''} ${user?.last_name || ''}`.trim(),
      });

      setMessage('Report created and PDF downloaded.');
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create report');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadSaved = async (reportId) => {
    setError('');
    try {
      const res = await reportService.getOne(reportId);
      if (!res.data.success) return;
      const { report, summary } = res.data.data;
      downloadWasteReportPdf({
        title: report.title,
        reportType: report.report_type,
        dateFrom: report.date_from,
        dateTo: report.date_to,
        summary,
        generatedBy: report.generated_by_name,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download PDF');
    }
  };

  const handleExportCsv = async () => {
    try {
      const payload = showModal ? buildPayload() : { report_type: 'weekly', reference_date: todayIso() };
      const res = await reportService.export({ ...payload, format: 'csv' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waste_report_${todayIso()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('CSV export failed');
    }
  };

  return (
    <div>
      {message && <div className="alert alert-success py-2">{message}</div>}
      {error && !showModal && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card-panel mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h6 className="fw-semibold mb-1">My Waste Reports</h6>
            <p className="text-muted small mb-0">
              Create and download your own daily, weekly, or monthly PDF reports.
              {user ? (
                <> Signed in as <strong>{user.first_name} {user.last_name}</strong> — only your reports are shown here.</>
              ) : null}
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button type="button" className="btn btn-success btn-sm" onClick={openCreateModal}>
              <i className="bi bi-file-earmark-plus me-1" />Create Report
            </button>
            <button type="button" className="btn btn-outline-success btn-sm" onClick={handleExportCsv}>
              <i className="bi bi-download me-1" />Quick CSV
            </button>
          </div>
        </div>
      </div>

      <div className="card-panel">
        <div className="filter-toolbar mb-3">
          <input className="form-control form-control-sm" placeholder="Search reports..."
            value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
          <select className="form-select form-select-sm" value={filters.report_type}
            onChange={(e) => setFilters({ ...filters, report_type: e.target.value, page: 1 })}>
            <option value="">All Types</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {loading ? <div className="spinner-border text-success" /> : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Date Range</th>
                  <th>Total</th>
                  <th>Generated By</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-4">You have no reports yet. Click Create Report to get started.</td></tr>
                ) : reports.map((r) => (
                  <tr key={r.id}>
                    <td className="fw-medium">{r.title}</td>
                    <td><span className="badge bg-success-subtle text-success text-capitalize">{r.report_type}</span></td>
                    <td><small>{formatReportRange(r.date_from, r.date_to)}</small></td>
                    <td>{r.total_detections}</td>
                    <td>{r.generated_by_name}</td>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <button type="button" className="btn btn-sm btn-outline-success" onClick={() => handleDownloadSaved(r.id)} title="Download PDF">
                        <i className="bi bi-file-earmark-pdf" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.total_pages > 1 && (
          <nav className="mt-3">
            <ul className="pagination pagination-sm justify-content-end">
              {Array.from({ length: pagination.total_pages }, (_, i) => (
                <li key={i} className={`page-item ${pagination.page === i + 1 ? 'active' : ''}`}>
                  <button type="button" className="page-link" onClick={() => setFilters({ ...filters, page: i + 1 })}>{i + 1}</button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {showModal && (
        <div className="modal show d-block report-modal" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header py-2 px-3">
                <h6 className="modal-title mb-0">Create Waste Report</h6>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body py-3 px-3">
                {error && <div className="alert alert-danger py-2 small">{error}</div>}

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small">Report period</label>
                    <select className="form-select form-select-sm" value={form.report_type}
                      onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly (7 days)</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom range</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small">Category filter</label>
                    <select className="form-select form-select-sm" value={form.waste_category}
                      onChange={(e) => setForm({ ...form, waste_category: e.target.value })}>
                      <option value="">All categories</option>
                      {WASTE_CATEGORIES.map((c) => <option key={c} value={c}>{WASTE_CATEGORY_LABELS[c]}</option>)}
                    </select>
                  </div>

                  {form.report_type !== 'custom' ? (
                    <div className="col-md-6">
                      <label className="form-label small">
                        {form.report_type === 'daily' ? 'Report date' : form.report_type === 'weekly' ? 'Week ending on' : 'Month (any day in month)'}
                      </label>
                      <input type="date" className="form-control form-control-sm" value={form.reference_date}
                        onChange={(e) => setForm({ ...form, reference_date: e.target.value })} />
                    </div>
                  ) : (
                    <>
                      <div className="col-md-6">
                        <label className="form-label small">From</label>
                        <input type="date" className="form-control form-control-sm" value={form.date_from}
                          onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small">To</label>
                        <input type="date" className="form-control form-control-sm" value={form.date_to}
                          onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
                      </div>
                    </>
                  )}

                  <div className="col-12">
                    <div className="report-range-pill">
                      <i className="bi bi-calendar3 me-1" />
                      <strong>{reportTypeLabel(form.report_type)}</strong>
                      <span className="text-muted mx-1">·</span>
                      {formatReportRange(range.date_from, range.date_to)}
                    </div>
                  </div>
                </div>

                <div className="report-preview-box">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-semibold">Preview</span>
                    <button type="button" className="btn btn-link btn-sm p-0" onClick={refreshPreview} disabled={previewLoading}>
                      Refresh
                    </button>
                  </div>
                  {previewLoading ? (
                    <div className="text-center py-3"><span className="spinner-border spinner-border-sm text-success" /></div>
                  ) : preview?.summary ? (
                    <>
                      <div className="row g-2 mb-2">
                        <div className="col-4"><div className="report-stat"><span>Total</span><strong>{preview.summary.total_detections}</strong></div></div>
                        <div className="col-4"><div className="report-stat"><span>Hotspots</span><strong>{preview.summary.hotspots}</strong></div></div>
                        <div className="col-4"><div className="report-stat"><span>Avg conf.</span><strong>{preview.summary.avg_confidence}%</strong></div></div>
                      </div>
                      {preview.summary.detections?.length > 0 ? (
                        <div className="table-responsive" style={{ maxHeight: 180 }}>
                          <table className="table table-sm table-striped mb-0">
                            <thead><tr><th>Category</th><th>Date</th><th>Conf.</th><th>Zone</th></tr></thead>
                            <tbody>
                              {preview.summary.detections.slice(0, 8).map((d) => (
                                <tr key={d.id}>
                                  <td className="text-uppercase small">{d.waste_category}</td>
                                  <td className="small">{d.detection_date}</td>
                                  <td className="small">{d.confidence_score}%</td>
                                  <td className="small">{d.zone_name || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted small mb-0">No detections found for this period.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted small mb-0">Select dates to preview report contents.</p>
                  )}
                </div>
              </div>
              <div className="modal-footer py-2 px-3">
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="button" className="btn btn-sm btn-success" onClick={handleCreateAndDownload} disabled={creating}>
                  {creating ? 'Creating…' : <><i className="bi bi-file-earmark-pdf me-1" />Create & Download PDF</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
