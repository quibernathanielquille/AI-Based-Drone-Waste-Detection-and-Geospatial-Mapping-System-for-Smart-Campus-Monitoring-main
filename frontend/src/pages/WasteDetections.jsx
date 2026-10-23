import { useEffect, useState } from 'react';
import { wasteService, detectService, userService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LiveCameraPanel from '../components/LiveCameraPanel';
import DetectionDetailsModal from '../components/DetectionDetailsModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  WASTE_CATEGORIES, WASTE_CATEGORY_LABELS, formatWasteCategory, formatRoleLabel, CAMPUS_MAP,
  getCategoryColor, getCategoryColorLight, getCategoryTextColor, resolveImageUrl,
} from '../utils/constants';
import { skipAlertsBriefly, setLastSeenId } from '../utils/wasteNotifications';

const emptyForm = {
  waste_category: 'plastic', latitude: '', longitude: '', confidence_score: '',
  detection_date: new Date().toISOString().split('T')[0], detection_time: '12:00',
  description: '', zone_name: '', is_hotspot: 0, status: 'pending',
};

const nowTime = () => new Date().toTimeString().slice(0, 5);

export default function WasteDetections() {
  const { isAdmin } = useAuth();
  const adminView = isAdmin();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ search: '', waste_category: '', detected_by: '', page: 1 });
  const [accountUsers, setAccountUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [inputMode, setInputMode] = useState('manual');
  const [yoloModel, setYoloModel] = useState('garbage');
  const [confidenceThreshold, setConfidenceThreshold] = useState(50);
  const [saveNotice, setSaveNotice] = useState('');
  const [detectLoading, setDetectLoading] = useState(false);
  const [detectNotice, setDetectNotice] = useState('');

  useEffect(() => {
    if (!adminView) return;
    userService.getAll({ page: 1, per_page: 50 }).then((res) => {
      if (res.data.success) setAccountUsers(res.data.data.items || []);
    }).catch(() => {});
  }, [adminView]);

  const load = () => {
    setLoading(true);
    const params = { ...filters };
    if (!params.detected_by) delete params.detected_by;
    wasteService.getAll(params)
      .then((res) => {
        if (res.data.success) {
          setItems(res.data.data.items);
          setPagination(res.data.data.pagination);
          setError('');
        }
      })
      .catch((err) => {
        setItems([]);
        setPagination({});
        setError(err.response?.data?.message || 'Could not load detections');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters]);

  const openModal = (item = null) => {
    if (item) {
      setForm({
        ...item,
        latitude: item.latitude,
        longitude: item.longitude,
        is_hotspot: item.is_hotspot ? 1 : 0,
      });
      setPreview(resolveImageUrl(item.waste_image) || '');
      setInputMode('manual');
    } else {
      setForm({
        ...emptyForm,
        latitude: CAMPUS_MAP.lat,
        longitude: CAMPUS_MAP.lng,
        detection_time: nowTime(),
      });
      setPreview('');
      setInputMode('manual');
    }
    setImageFile(null);
    setError('');
    setSaveNotice('');
    setDetectNotice('');
    setModal(item ? 'edit' : 'add');
  };

  const applyYoloResult = (best, source = 'upload') => {
    const now = new Date();
    const sourceLabel = source === 'camera' ? 'live camera' : 'uploaded image';
    setForm((prev) => ({
      ...prev,
      waste_category: best.category,
      confidence_score: best.confidence,
      detection_date: now.toISOString().split('T')[0],
      detection_time: now.toTimeString().slice(0, 5),
      description: `YOLO detection (${sourceLabel}): ${best.label} via ${best.model} model`,
      zone_name: prev.zone_name || (source === 'camera' ? 'Live Camera - DNSC' : 'Image Upload - DNSC'),
      latitude: prev.latitude || CAMPUS_MAP.lat,
      longitude: prev.longitude || CAMPUS_MAP.lng,
      status: 'verified',
      is_hotspot: best.confidence >= 85 ? 1 : 0,
    }));
    setDetectNotice(`Detected: ${formatWasteCategory(best.category)} — ${best.confidence}% confidence`);
  };

  const runImageDetection = async (file, localPreviewUrl = '') => {
    if (!file) return;
    setDetectLoading(true);
    setError('');
    setDetectNotice('');
    try {
      const res = await detectService.detect(file, yoloModel, confidenceThreshold / 100);
      const data = res.data;
      const best = data.best;

      if (data.annotated_image) {
        if (localPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(localPreviewUrl);
        setPreview(data.annotated_image);
      } else if (!localPreviewUrl) {
        setPreview(URL.createObjectURL(file));
      }

      if (!best) {
        setDetectNotice('No waste detected in this image. Try another photo or lower the confidence threshold.');
        return;
      }

      applyYoloResult(best, 'upload');
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Detection failed';
      setError(msg);
    } finally {
      setDetectLoading(false);
    }
  };

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    if (inputMode === 'upload') {
      await runImageDetection(file, localPreview);
    }
  };

  const buildFormData = (overrides = {}) => {
    const merged = { ...form, ...overrides };
    const fd = new FormData();
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== null && v !== undefined) fd.append(k, v);
    });
    const img = overrides.waste_image || imageFile;
    if (img instanceof Blob) fd.append('waste_image', img, 'capture.jpg');
    else if (img) fd.append('waste_image', img);
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (modal === 'edit' && form.id) {
        await wasteService.update(form.id, buildFormData());
      } else {
        skipAlertsBriefly();
        const res = await wasteService.create(buildFormData());
        if (res.data?.data?.id) setLastSeenId(res.data.data.id);
      }
      setModal(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const handleCameraDetect = (best) => {
    applyYoloResult(best, 'camera');
  };

  const handleCameraSave = async (best, blob) => {
    const now = new Date();
    const fd = buildFormData({
      waste_category: best.category,
      confidence_score: best.confidence,
      detection_date: now.toISOString().split('T')[0],
      detection_time: now.toTimeString().slice(0, 5),
      description: `YOLO live detection: ${best.label} via ${best.model} model`,
      zone_name: 'Live Camera - DNSC',
      latitude: CAMPUS_MAP.lat,
      longitude: CAMPUS_MAP.lng,
      status: 'verified',
      is_hotspot: best.confidence >= 85 ? 1 : 0,
      waste_image: blob,
    });
    skipAlertsBriefly();
    const res = await wasteService.create(fd);
    if (res.data?.data?.id) setLastSeenId(res.data.data.id);
    setSaveNotice(`Saved ${formatWasteCategory(best.category)} at ${best.confidence}%`);
    setTimeout(() => setSaveNotice(''), 4000);
    load();
  };

  const handleDelete = (id) => setDeleteTarget(id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await wasteService.delete(deleteTarget);
      setDeleteTarget(null);
      load();
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderAddedBy = (item) => {
    if (!item.detected_by_name) {
      return <span className="text-muted small">Unknown</span>;
    }
    return (
      <div className="added-by-cell">
        <div className="added-by-name">{item.detected_by_name}</div>
        {item.detected_by_email && <div className="added-by-email">{item.detected_by_email}</div>}
        {item.detected_by_role && (
          <span className="badge bg-success-subtle text-success mt-1" style={{ fontSize: '0.65rem' }}>
            {formatRoleLabel({ role: item.detected_by_role_slug, role_name: item.detected_by_role })}
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="page-toolbar">
        <div className="page-toolbar-actions">
          <input className="form-control" placeholder="Search..."
            value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
          <select className="form-select"
            value={filters.waste_category} onChange={(e) => setFilters({ ...filters, waste_category: e.target.value, page: 1 })}>
            <option value="">All Categories</option>
            {WASTE_CATEGORIES.map((c) => <option key={c} value={c}>{WASTE_CATEGORY_LABELS[c]}</option>)}
          </select>
          {adminView && (
            <select className="form-select" style={{ minWidth: 180 }}
              value={filters.detected_by}
              onChange={(e) => setFilters({ ...filters, detected_by: e.target.value, page: 1 })}>
              <option value="">All users</option>
              {accountUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
              ))}
            </select>
          )}
        </div>
        <button className="btn btn-success" onClick={() => openModal()}><i className="bi bi-plus-lg me-1" />Add Detection</button>
      </div>

      {saveNotice && <div className="alert alert-success py-2">{saveNotice}</div>}
      {error && !modal && <div className="alert alert-danger py-2">{error}</div>}

      <div className="card-panel">
        {loading ? <div className="text-center py-4"><div className="spinner-border text-success" /></div> : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Category</th>
                  {adminView && <th>Added By</th>}
                  <th>Location</th>
                  <th>Date</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.waste_image ? <img src={resolveImageUrl(item.waste_image)} alt="" className="thumb-img" /> : '-'}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: getCategoryColorLight(item.waste_category),
                          color: getCategoryTextColor(item.waste_category),
                          border: `1px solid ${getCategoryColor(item.waste_category)}`,
                        }}
                      >
                        {formatWasteCategory(item.waste_category)}
                      </span>
                    </td>
                    {adminView && <td>{renderAddedBy(item)}</td>}
                    <td><small>{Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}</small></td>
                    <td>{item.detection_date} {item.detection_time}</td>
                    <td>{item.confidence_score}%</td>
                    <td><span className="badge bg-secondary">{item.status}</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setModal({ view: item })}><i className="bi bi-eye" /></button>
                      <button className="btn btn-sm btn-outline-success me-1" onClick={() => openModal(item)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}><i className="bi bi-trash" /></button>
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
                  <button className="page-link" onClick={() => setFilters({ ...filters, page: i + 1 })}>{i + 1}</button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <div className="modal show d-block detection-modal" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered detection-modal-dialog modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header flex-shrink-0 py-2 px-3">
                <h6 className="modal-title mb-0">{modal === 'edit' ? 'Edit' : 'Add'} Detection</h6>
                <button type="button" className="btn-close" onClick={() => setModal(null)} />
              </div>
              <form onSubmit={handleSubmit} className="detection-modal-form">
                <div className="modal-body py-2 px-3">
                  {error && <div className="alert alert-danger py-2 mb-2 small">{error}</div>}

                  {modal === 'add' && (
                    <>
                      <div className="detection-input-tabs mb-2" role="group">
                        <button type="button" className={`btn btn-sm btn-outline-success ${inputMode === 'manual' ? 'active' : ''}`}
                          onClick={() => setInputMode('manual')}>
                          <i className="bi bi-pencil" /> Manual
                        </button>
                        <button type="button" className={`btn btn-sm btn-outline-success ${inputMode === 'upload' ? 'active' : ''}`}
                          onClick={() => setInputMode('upload')}>
                          <i className="bi bi-upload" /> Upload
                        </button>
                        <button type="button" className={`btn btn-sm btn-outline-success ${inputMode === 'camera' ? 'active' : ''}`}
                          onClick={() => setInputMode('camera')}>
                          <i className="bi bi-camera-video" /> Camera
                        </button>
                      </div>

                      {inputMode === 'upload' && (
                        <div className="detection-upload-panel mb-2">
                          <div className="row g-2 align-items-end mb-2">
                            <div className="col-6">
                              <label className="form-label">Model</label>
                              <select className="form-select form-select-sm" value={yoloModel}
                                onChange={(e) => setYoloModel(e.target.value)}>
                                <option value="garbage">Garbage (6 types)</option>
                                <option value="plastic">Plastic detection</option>
                              </select>
                            </div>
                            <div className="col-6">
                              <label className="form-label">Confidence {confidenceThreshold}%</label>
                              <input type="range" className="form-range form-range-sm" min="30" max="95" value={confidenceThreshold}
                                onChange={(e) => setConfidenceThreshold(Number(e.target.value))} />
                            </div>
                          </div>
                          <input type="file" className="form-control form-control-sm mb-2" accept="image/*" onChange={handleImage} disabled={detectLoading} />
                          {detectLoading && (
                            <div className="small text-muted mb-1">
                              <span className="spinner-border spinner-border-sm me-1" />Detecting...
                            </div>
                          )}
                          {preview && (
                            <div className="detection-preview-box mb-2">
                              <img src={preview} alt="Detection preview" className="detection-preview-img" />
                            </div>
                          )}
                          {detectNotice && (
                            <div className={`alert py-1 px-2 mb-0 small ${detectNotice.startsWith('Detected') ? 'alert-success' : 'alert-warning'}`}>
                              {detectNotice}
                            </div>
                          )}
                        </div>
                      )}

                      {inputMode === 'camera' && (
                        <div className="camera-mode-section">
                          <div className="camera-controls-row">
                            <select className="form-select form-select-sm" value={yoloModel}
                              onChange={(e) => setYoloModel(e.target.value)}>
                              <option value="garbage">Garbage (6 types)</option>
                              <option value="plastic">Plastic (Bag/Bottle/Cup)</option>
                            </select>
                            <div className="camera-confidence">
                              <label className="small text-muted">Confidence {confidenceThreshold}%</label>
                              <input type="range" className="form-range" min="30" max="95" value={confidenceThreshold}
                                onChange={(e) => setConfidenceThreshold(Number(e.target.value))} />
                            </div>
                          </div>
                          <LiveCameraPanel
                            model={yoloModel}
                            confidenceThreshold={confidenceThreshold}
                            onDetect={handleCameraDetect}
                            onSave={handleCameraSave}
                            onError={(msg) => setError(msg)}
                          />
                          <p className="camera-hint">
                            Point at waste, detect, then tap <strong>Save to Database</strong> to record it.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {!(modal === 'add' && inputMode === 'camera') && (
                  <div className="row g-2 detection-form-grid">
                    <div className="col-6">
                      <label className="form-label">Category *</label>
                      <select className="form-select form-select-sm" value={form.waste_category} onChange={(e) => setForm({ ...form, waste_category: e.target.value })} required>
                        {WASTE_CATEGORIES.map((c) => <option key={c} value={c}>{WASTE_CATEGORY_LABELS[c]}</option>)}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">Confidence *</label>
                      <input type="number" className="form-control form-control-sm" min="0" max="100" step="0.01" value={form.confidence_score} onChange={(e) => setForm({ ...form, confidence_score: e.target.value })} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Latitude *</label>
                      <input type="number" step="any" className="form-control form-control-sm" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Longitude *</label>
                      <input type="number" step="any" className="form-control form-control-sm" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
                    </div>
                    <div className="col-4">
                      <label className="form-label">Date *</label>
                      <input type="date" className="form-control form-control-sm" value={form.detection_date} onChange={(e) => setForm({ ...form, detection_date: e.target.value })} required />
                    </div>
                    <div className="col-4">
                      <label className="form-label">Time *</label>
                      <input type="time" className="form-control form-control-sm" value={form.detection_time} onChange={(e) => setForm({ ...form, detection_time: e.target.value })} required />
                    </div>
                    <div className="col-4">
                      <label className="form-label">Zone</label>
                      <input className="form-control form-control-sm" value={form.zone_name || ''} onChange={(e) => setForm({ ...form, zone_name: e.target.value })} />
                    </div>
                    <div className="col-8">
                      <label className="form-label">Description</label>
                      <input type="text" className="form-control form-control-sm" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional notes" />
                    </div>
                    <div className="col-4 d-flex align-items-end pb-1">
                      <div className="form-check mb-0">
                        <input type="checkbox" className="form-check-input" checked={!!form.is_hotspot} onChange={(e) => setForm({ ...form, is_hotspot: e.target.checked ? 1 : 0 })} />
                        <label className="form-check-label">Hotspot</label>
                      </div>
                    </div>
                    {(inputMode !== 'upload' && (inputMode === 'manual' || modal === 'edit')) && (
                      <div className="col-6">
                        <label className="form-label">Waste Image</label>
                        <input type="file" className="form-control form-control-sm" accept="image/*" onChange={handleImage} disabled={detectLoading} />
                      </div>
                    )}
                    {inputMode !== 'upload' && preview && (
                      <div className="col-6">
                        <label className="form-label">Preview</label>
                        <div className="detection-preview-box detection-preview-box-sm">
                          <img src={preview} alt="Preview" className="detection-preview-img" />
                        </div>
                      </div>
                    )}
                  </div>
                  )}
                </div>
                <div className="modal-footer flex-shrink-0 py-2 px-3">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setModal(null)}>Close</button>
                  {inputMode !== 'camera' && (
                    <button type="submit" className="btn btn-sm btn-success">Save</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {modal?.view && (
        <DetectionDetailsModal
          detection={modal.view}
          onClose={() => setModal(null)}
          onEdit={(item) => openModal(item)}
          showAddedBy={adminView}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete detection?"
        message="This waste detection will be permanently removed. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
