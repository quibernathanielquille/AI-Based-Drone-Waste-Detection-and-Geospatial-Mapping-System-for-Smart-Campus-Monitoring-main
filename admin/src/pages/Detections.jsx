import { useEffect, useState } from 'react';
import { wasteService } from '../services/api';
import {
  formatWasteCategory,
  formatRoleLabel,
  resolveImageUrl,
  getCategoryColor,
  getCategoryColorLight,
  getCategoryTextColor,
} from '../utils/constants';

export default function Detections() {
  const [items, setItems] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({ search: '', detected_by: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null);

  const load = () => {
    setLoading(true);
    const params = { ...filters, per_page: 15 };
    if (!params.detected_by) delete params.detected_by;

    Promise.all([
      wasteService.getAll(params),
      wasteService.getUserStats(),
    ])
      .then(([listRes, statsRes]) => {
        if (listRes.data.success) {
          setItems(listRes.data.data.items);
          setPagination(listRes.data.data.pagination);
        }
        if (statsRes.data.success) setUserStats(statsRes.data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters]);

  const renderAddedBy = (item) => {
    if (!item.detected_by_name) {
      return <span className="text-muted small">Unknown user</span>;
    }
    return (
      <div>
        <div className="fw-semibold small">{item.detected_by_name}</div>
        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{item.detected_by_email}</div>
        {item.detected_by_role && (
          <span className="badge bg-success-subtle text-success mt-1">
            {formatRoleLabel({ role: item.detected_by_role_slug, role_name: item.detected_by_role })}
          </span>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="card-panel mb-4">
        <h5 className="fw-semibold mb-1">Detection Activity</h5>
        <p className="text-muted small mb-0">
          See who added each waste detection and how many records each user has submitted.
        </p>
      </div>

      <div className="row g-4 mb-4">
        {userStats.filter((u) => u.detection_count > 0).map((u) => (
          <div key={u.id} className="col-sm-6 col-lg-4 col-xl-3">
            <button
              type="button"
              className={`stat-card h-100 w-100 text-start border-0 ${filters.detected_by === String(u.id) ? 'border border-success' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setFilters((f) => ({
                ...f,
                detected_by: f.detected_by === String(u.id) ? '' : String(u.id),
                page: 1,
              }))}
            >
              <div className="stat-icon" style={{ background: '#4ADE8022', color: '#4ADE80' }}>
                <i className="bi bi-person-check" />
              </div>
              <div>
                <p className="stat-value mb-0">{u.detection_count}</p>
                <span className="stat-label d-block">{u.user_name}</span>
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>{formatRoleLabel({ role: u.role_slug, role_name: u.role_name })}</span>
              </div>
            </button>
          </div>
        ))}
        {userStats.filter((u) => u.detection_count > 0).length === 0 && (
          <div className="col-12">
            <p className="text-muted small mb-0">No detection records yet.</p>
          </div>
        )}
      </div>

      <div className="page-toolbar">
        <div className="page-toolbar-actions d-flex flex-wrap gap-2">
          <input
            className="form-control"
            placeholder="Search category, zone, user name, email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
          <select
            className="form-select"
            style={{ maxWidth: 220 }}
            value={filters.detected_by}
            onChange={(e) => setFilters({ ...filters, detected_by: e.target.value, page: 1 })}
          >
            <option value="">All users</option>
            {userStats.filter((u) => u.detection_count > 0).map((u) => (
              <option key={u.id} value={u.id}>
                {u.user_name} ({u.detection_count})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-panel">
        {loading ? (
          <div className="text-center py-4"><div className="spinner-border text-success" /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Category</th>
                  <th>Added By</th>
                  <th>Date &amp; Time</th>
                  <th>Confidence</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={8} className="text-muted text-center py-4">No detections found</td></tr>
                ) : items.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>
                      {item.waste_image ? (
                        <img src={resolveImageUrl(item.waste_image)} alt="" className="thumb-img" />
                      ) : '-'}
                    </td>
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
                    <td>{renderAddedBy(item)}</td>
                    <td className="text-nowrap small">{item.detection_date} {item.detection_time}</td>
                    <td>{item.confidence_score}%</td>
                    <td><span className="badge bg-secondary">{item.status}</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setViewItem(item)}>
                        <i className="bi bi-eye" />
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
                  <button type="button" className="page-link" onClick={() => setFilters({ ...filters, page: i + 1 })}>
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>

      {viewItem && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header py-2 px-3">
                <h6 className="modal-title mb-0">Detection #{viewItem.id}</h6>
                <button type="button" className="btn-close" onClick={() => setViewItem(null)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-5">
                    {viewItem.waste_image ? (
                      <img src={resolveImageUrl(viewItem.waste_image)} alt="" className="img-fluid rounded border" />
                    ) : (
                      <div className="text-muted small">No image</div>
                    )}
                  </div>
                  <div className="col-md-7">
                    <p className="mb-1"><strong>Category:</strong> {formatWasteCategory(viewItem.waste_category)}</p>
                    <p className="mb-1"><strong>Confidence:</strong> {viewItem.confidence_score}%</p>
                    <p className="mb-1"><strong>Status:</strong> {viewItem.status}</p>
                    <p className="mb-1"><strong>Zone:</strong> {viewItem.zone_name || '—'}</p>
                    <p className="mb-1"><strong>Coordinates:</strong> {Number(viewItem.latitude).toFixed(6)}, {Number(viewItem.longitude).toFixed(6)}</p>
                    <p className="mb-1"><strong>Date:</strong> {viewItem.detection_date} {viewItem.detection_time}</p>
                    <hr />
                    <p className="mb-1 fw-semibold">Added by</p>
                    <p className="mb-1">{viewItem.detected_by_name || 'Unknown user'}</p>
                    <p className="mb-1 text-muted small">{viewItem.detected_by_email || '—'}</p>
                    {viewItem.detected_by_role && (
                      <span className="badge bg-success-subtle text-success">
                        {formatRoleLabel({ role: viewItem.detected_by_role_slug, role_name: viewItem.detected_by_role })}
                      </span>
                    )}
                    {viewItem.description && (
                      <p className="mt-3 mb-0 small text-muted">{viewItem.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
