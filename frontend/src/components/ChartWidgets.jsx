import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale,
  BarElement, LineElement, PointElement, Filler,
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  getCategoryColor,
  getCategoryColorLight,
  formatWasteCategory,
  HOTSPOT_BAR_COLORS,
  THEME,
} from '../utils/constants';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

ChartJS.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = '#64748b';

const greenTooltip = {
  backgroundColor: '#15803d',
  titleColor: '#ffffff',
  bodyColor: '#ecfdf5',
  borderColor: '#4ade80',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        boxWidth: 10,
        padding: 14,
        font: { family: "'Plus Jakarta Sans', system-ui, sans-serif", size: 11, weight: '500' },
      },
    },
    tooltip: {
      ...greenTooltip,
      titleFont: { family: "'Outfit', system-ui, sans-serif", size: 12, weight: '600' },
      bodyFont: { family: "'Plus Jakarta Sans', system-ui, sans-serif", size: 11 },
    },
  },
  scales: {
    x: {
      ticks: { font: { family: "'Plus Jakarta Sans', system-ui, sans-serif", size: 11 }, color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.15)' },
    },
    y: {
      ticks: { font: { family: "'Plus Jakarta Sans', system-ui, sans-serif", size: 11 }, color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.15)' },
    },
  },
};

const categoryFromItem = (item, labelKey) =>
  item?.waste_category || item?.[labelKey] || item?.label;

export function PieChartWidget({ data }) {
  const items = data || [];
  const chartData = {
    labels: items.map((d) => formatWasteCategory(categoryFromItem(d, 'waste_category'))),
    datasets: [{
      data: items.map((d) => d.value || d.count),
      backgroundColor: items.map((d) => getCategoryColor(categoryFromItem(d, 'waste_category'))),
      borderColor: '#ffffff',
      borderWidth: 2,
    }],
  };
  return <div className="chart-container"><Pie data={chartData} options={chartOptions} /></div>;
}

export function BarChartWidget({ data, labelKey = 'waste_category', valueKey = 'count', variant = 'auto' }) {
  const items = data || [];
  const isHotspotBar = variant === 'hotspot';
  const isWasteBar = !isHotspotBar && (
    variant === 'waste'
    || (variant === 'auto' && (labelKey === 'waste_category' || items.some((d) => d.waste_category)))
  );

  const chartData = {
    labels: items.map((d) => {
      const raw = (d[labelKey] || d.zone_name || '').toString();
      return isWasteBar ? formatWasteCategory(raw) : raw;
    }),
    datasets: [{
      label: 'Count',
      data: items.map((d) => d[valueKey] || d.count),
      backgroundColor: isWasteBar
        ? items.map((d) => getCategoryColor(categoryFromItem(d, labelKey)))
        : items.map((_, i) => HOTSPOT_BAR_COLORS[i % HOTSPOT_BAR_COLORS.length]),
      borderRadius: 6,
      hoverBackgroundColor: isWasteBar
        ? items.map((d) => getCategoryColor(categoryFromItem(d, labelKey)))
        : items.map(() => THEME.primary),
    }],
  };

  return (
    <div className="chart-container">
      <Bar data={chartData} options={{ ...chartOptions, scales: { y: { beginAtZero: true } } }} />
    </div>
  );
}

export function LineChartWidget({ data, labelKey = 'date', valueKey = 'count', color }) {
  const lineColor = color || THEME.primaryDark;
  const chartData = {
    labels: data?.map((d) => d[labelKey] || d.month) || [],
    datasets: [{
      label: 'Detections',
      data: data?.map((d) => d[valueKey] || d.count) || [],
      borderColor: lineColor,
      backgroundColor: getCategoryColorLight('biodegradable'),
      fill: true,
      tension: 0.4,
    }],
  };
  return <div className="chart-container"><Line data={chartData} options={{ ...chartOptions, scales: { y: { beginAtZero: true } } }} /></div>;
}

export function AreaChartWidget({ data }) {
  return <LineChartWidget data={data} labelKey="month" color={THEME.primaryDark} />;
}
