import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { PieChartWidget, BarChartWidget, LineChartWidget, AreaChartWidget } from '../components/ChartWidgets';
import MiniMap from '../components/MiniMap';
import { getCategoryColor, getCategoryColorLight, getCategoryTextColor, formatWasteCategory } from '../utils/constants';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats()
      .then((res) => { if (res.data.success) setData(res.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-5"><div className="spinner-border text-success" /></div>;
  }

  const stats = data?.stats || {};
  const cards = [
    { label: 'Total Detections', value: stats.total_detections, icon: 'bi-trash', color: '#4ADE80' },
    { label: "Today's Detections", value: stats.today_detections, icon: 'bi-calendar-check', color: '#22c55e' },
    { label: 'Active Hotspots', value: stats.active_hotspots, icon: 'bi-fire', color: '#f59e0b' },
    { label: 'Waste Categories', value: stats.waste_categories, icon: 'bi-tags', color: '#3b82f6' },
  ];

  return (
    <div className="dashboard-page">
      <div className="row g-4 mb-4">
        {cards.map((c) => (
          <div key={c.label} className="col-sm-6 col-xl-3">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: `${c.color}22`, color: c.color }}>
                <i className={`bi ${c.icon}`} />
              </div>
              <div>
                <p className="stat-value">{c.value ?? 0}</p>
                <span className="stat-label">{c.label}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6 col-lg-3">
          <div className="card-panel h-100">
            <h6 className="panel-title mb-3">Waste Categories</h6>
            <div className="category-list">
              {(data?.categories || []).map((c) => (
                <div key={c.waste_category} className="d-flex justify-content-between align-items-center mb-2">
                  <span className="dashboard-category-name">
                    <span className="category-dot" style={{ background: getCategoryColor(c.waste_category) }} />
                    {formatWasteCategory(c.waste_category)}
                  </span>
                  <span className="dashboard-category-count">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="card-panel h-100">
            <h6 className="panel-title mb-3">Category Distribution</h6>
            <PieChartWidget data={data?.charts?.pie} />
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card-panel h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="panel-title mb-0">Campus Mini Map</h6>
              <Link to="/map" className="btn btn-sm btn-outline-success">Full Map</Link>
            </div>
            <MiniMap points={data?.map_points} />
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6">
          <div className="card-panel"><h6 className="panel-title mb-3">Bar Chart</h6><BarChartWidget data={data?.charts?.bar} variant="waste" /></div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card-panel"><h6 className="panel-title mb-3">Line Chart</h6><LineChartWidget data={data?.charts?.line} /></div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card-panel"><h6 className="panel-title mb-3">Area Chart (Monthly)</h6><AreaChartWidget data={data?.charts?.area} /></div>
        </div>
        <div className="col-12 col-lg-6">
          <div className="card-panel">
            <h6 className="panel-title mb-3">Recent Activities</h6>
            <div className="activity-list">
              {(data?.recent_activities || []).map((a) => (
                <div key={a.id} className="activity-item">
                  <i className="bi bi-circle-fill text-success" style={{ fontSize: 6 }} />
                  <div>
                    <small className="fw-semibold">{a.action} — {a.module}</small>
                    <small className="d-block text-muted">{a.description}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card-panel">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="panel-title mb-0">Recent Detections</h6>
          <Link to="/waste-detections" className="btn btn-sm btn-success">View All</Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead><tr><th>Category</th><th>Zone</th><th>Date</th><th>Confidence</th><th>Hotspot</th></tr></thead>
            <tbody>
              {(data?.recent_detections || []).map((d) => (
                <tr key={d.id}>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: getCategoryColorLight(d.waste_category),
                        color: getCategoryTextColor(d.waste_category),
                        border: `1px solid ${getCategoryColor(d.waste_category)}`,
                      }}
                    >
                      {formatWasteCategory(d.waste_category)}
                    </span>
                  </td>
                  <td>{d.zone_name || '—'}</td>
                  <td>{d.detection_date}</td>
                  <td>{d.confidence_score}%</td>
                  <td>{d.is_hotspot ? <i className="bi bi-fire text-warning" /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
