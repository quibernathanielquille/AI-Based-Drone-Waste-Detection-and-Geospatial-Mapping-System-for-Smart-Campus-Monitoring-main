import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, userService, settingsService } from '../services/api';
import { formatWasteCategory, formatRoleLabel } from '../utils/constants';

const OFFICER_PORTAL_URL = import.meta.env.VITE_OFFICER_PORTAL_URL || 'http://localhost:5173';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [campusName, setCampusName] = useState('DNSC Campus');
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardService.getStats(),
      userService.getAll({ page: 1 }),
      settingsService.get(),
      settingsService.getActivityLogs({ all: 1 }),
    ])
      .then(([dashRes, usersRes, settingsRes, logsRes]) => {
        if (dashRes.data.success) setStats(dashRes.data.data);
        if (usersRes.data.success) setUserCount(usersRes.data.data.pagination?.total || 0);
        if (settingsRes.data.success) {
          setCampusName(settingsRes.data.data.campus_name || 'DNSC Campus');
        }
        if (logsRes.data.success) setRecentLogs((logsRes.data.data.items || []).slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-success" /></div>;
  }

  const dashStats = stats?.stats || {};
  const cards = [
    { label: 'Total Users', value: userCount, icon: 'bi-people', color: '#3b82f6', to: '/users' },
    { label: 'Total Detections', value: dashStats.total_detections, icon: 'bi-trash', color: '#4ADE80', to: '/detections' },
    { label: "Today's Detections", value: dashStats.today_detections, icon: 'bi-calendar-check', color: '#22c55e' },
    { label: 'Active Hotspots', value: dashStats.active_hotspots, icon: 'bi-fire', color: '#f59e0b' },
  ];

  return (
    <div className="dashboard-page">
      <div className="card-panel mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h5 className="fw-semibold mb-1">Administrator Control Center</h5>
            <p className="text-muted small mb-0">
              Managing <strong>{campusName}</strong> — connected to the same Campus Eye backend and database.
            </p>
          </div>
          <a href={OFFICER_PORTAL_URL} className="btn btn-outline-success btn-sm" target="_blank" rel="noreferrer">
            <i className="bi bi-box-arrow-up-right me-1" />Open Officer Portal
          </a>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {cards.map((c) => (
          <div key={c.label} className="col-sm-6 col-xl-3">
            {c.to ? (
              <Link to={c.to} className="text-decoration-none">
                <div className="stat-card h-100">
                  <div className="stat-icon" style={{ background: `${c.color}22`, color: c.color }}>
                    <i className={`bi ${c.icon}`} />
                  </div>
                  <div>
                    <p className="stat-value">{c.value ?? 0}</p>
                    <span className="stat-label">{c.label}</span>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="stat-card h-100">
                <div className="stat-icon" style={{ background: `${c.color}22`, color: c.color }}>
                  <i className={`bi ${c.icon}`} />
                </div>
                <div>
                  <p className="stat-value">{c.value ?? 0}</p>
                  <span className="stat-label">{c.label}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="card-panel h-100">
            <h6 className="panel-title mb-3">Quick Actions</h6>
            <div className="d-grid gap-2">
              <Link to="/detections" className="btn btn-success btn-sm text-start">
                <i className="bi bi-person-check me-2" />View who added detections
              </Link>
              <Link to="/users" className="btn btn-outline-success btn-sm text-start">
                <i className="bi bi-person-plus me-2" />Add or manage users
              </Link>
              <Link to="/settings?tab=system" className="btn btn-outline-success btn-sm text-start">
                <i className="bi bi-sliders me-2" />Configure campus system settings
              </Link>
              <Link to="/settings?tab=logs" className="btn btn-outline-success btn-sm text-start">
                <i className="bi bi-journal-text me-2" />View all activity logs
              </Link>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card-panel h-100">
            <h6 className="panel-title mb-3">Waste Categories</h6>
            <div className="category-list">
              {(stats?.categories || []).length === 0 ? (
                <p className="text-muted small mb-0">No detection data yet.</p>
              ) : (stats?.categories || []).map((c) => (
                <div key={c.waste_category} className="d-flex justify-content-between align-items-center mb-2">
                  <span>{formatWasteCategory(c.waste_category)}</span>
                  <span className="dashboard-category-count">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card-panel">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="panel-title mb-0">Recent Detections — Who Added</h6>
              <Link to="/detections" className="btn btn-sm btn-outline-success">View all</Link>
            </div>
            <div className="table-responsive mb-4">
              <table className="table table-sm settings-logs-table mb-0">
                <thead>
                  <tr><th>ID</th><th>Category</th><th>Added By</th><th>Role</th><th>Date</th><th>Confidence</th></tr>
                </thead>
                <tbody>
                  {(stats?.recent_detections || []).length === 0 ? (
                    <tr><td colSpan={6} className="text-muted text-center py-3">No detections yet</td></tr>
                  ) : (stats?.recent_detections || []).map((d) => (
                    <tr key={d.id}>
                      <td>#{d.id}</td>
                      <td>{formatWasteCategory(d.waste_category)}</td>
                      <td>{d.detected_by_name || 'Unknown'}</td>
                      <td>{d.detected_by_role ? formatRoleLabel({ role_name: d.detected_by_role }) : '—'}</td>
                      <td className="text-nowrap">{d.detection_date} {d.detection_time}</td>
                      <td>{d.confidence_score}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card-panel">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="panel-title mb-0">Recent Activity</h6>
              <Link to="/settings?tab=logs" className="btn btn-sm btn-outline-success">View all</Link>
            </div>
            <div className="table-responsive">
              <table className="table table-sm settings-logs-table mb-0">
                <thead>
                  <tr><th>Action</th><th>Module</th><th>Description</th><th>User</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {recentLogs.length === 0 ? (
                    <tr><td colSpan={5} className="text-muted text-center py-3">No activity yet</td></tr>
                  ) : recentLogs.map((l) => (
                    <tr key={l.id}>
                      <td><span className="badge bg-secondary-subtle text-secondary">{l.action}</span></td>
                      <td>{l.module}</td>
                      <td>{l.description}</td>
                      <td>{l.user_name || 'System'}</td>
                      <td className="text-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
