import { useEffect, useState } from 'react';
import { analyticsService } from '../services/api';
import { PieChartWidget, BarChartWidget, LineChartWidget, AreaChartWidget } from '../components/ChartWidgets';
import { formatWasteCategory } from '../utils/constants';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getData()
      .then((res) => { if (res.data.success) setData(res.data.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-success" /></div>;

  const summary = data?.summary || {};

  return (
    <div>
      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#4ADE8022', color: '#4ADE80' }}><i className="bi bi-arrow-up-circle" /></div>
            <div>
              <h5 className="mb-0">{formatWasteCategory(summary.most_common?.waste_category) || 'N/A'}</h5>
              <small className="text-muted">Most Common Waste</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#3b82f622', color: '#3b82f6' }}><i className="bi bi-arrow-down-circle" /></div>
            <div>
              <h5 className="mb-0">{formatWasteCategory(summary.least_common?.waste_category) || 'N/A'}</h5>
              <small className="text-muted">Least Common Waste</small>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#f59e0b22', color: '#f59e0b' }}><i className="bi bi-fire" /></div>
            <div>
              <h5 className="mb-0">{data?.hotspot_stats?.[0]?.zone_name || 'N/A'}</h5>
              <small className="text-muted">Top Hotspot Zone</small>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-6"><div className="card-panel"><h6 className="fw-semibold mb-3">Pie Chart - Categories</h6><PieChartWidget data={data?.charts?.pie} /></div></div>
        <div className="col-12 col-lg-6"><div className="card-panel"><h6 className="fw-semibold mb-3">Bar Chart - Hotspots</h6><BarChartWidget data={data?.charts?.bar} labelKey="zone_name" variant="hotspot" /></div></div>
        <div className="col-12 col-lg-6"><div className="card-panel"><h6 className="fw-semibold mb-3">Line Chart - Detection Frequency</h6><LineChartWidget data={data?.detection_frequency} labelKey="day_name" /></div></div>
        <div className="col-12 col-lg-6"><div className="card-panel"><h6 className="fw-semibold mb-3">Area Chart - Monthly Trends</h6><AreaChartWidget data={data?.monthly_trends} /></div></div>
      </div>

      <div className="card-panel">
        <h6 className="fw-semibold mb-3"><i className="bi bi-lightbulb text-warning me-2" />Smart Insights</h6>
        <ul className="list-unstyled mb-0">
          {(data?.insights || []).map((insight, i) => (
            <li key={i} className="mb-2 p-2 rounded bg-light"><i className="bi bi-check2-circle text-success me-2" />{insight}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
