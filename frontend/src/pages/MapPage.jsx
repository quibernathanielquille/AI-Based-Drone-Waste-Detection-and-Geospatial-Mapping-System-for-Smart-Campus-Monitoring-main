import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import 'leaflet.markercluster';
import 'leaflet.heat';
import { mapService } from '../services/api';
import {
  CAMPUS_MAP,
  WASTE_CATEGORIES, WASTE_CATEGORY_LABELS, formatWasteCategory,
  getCategoryColor, getCategoryTextColor, resolveImageUrl,
} from '../utils/constants';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MapPage() {
  const [searchParams] = useSearchParams();
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const clusterGroup = useRef(null);
  const heatLayer = useRef(null);
  const [detections, setDetections] = useState([]);
  const [mapConfig, setMapConfig] = useState({
    lat: CAMPUS_MAP.lat,
    lng: CAMPUS_MAP.lng,
    zoom: CAMPUS_MAP.zoom,
    campus_name: CAMPUS_MAP.name,
  });
  const [filters, setFilters] = useState({ waste_category: '', date_from: '', date_to: '' });
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [searchLat, setSearchLat] = useState('');
  const [searchLng, setSearchLng] = useState('');

  const loadData = () => {
    mapService.getDetections(filters).then((res) => {
      if (res.data.success) {
        setDetections(res.data.data.detections);
        setMapConfig(res.data.data.map_config);
      }
    });
  };

  useEffect(() => { loadData(); }, [filters]);

  useEffect(() => {
    const onResize = () => mapInstance.current?.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = L.map(mapContainer.current).setView([mapConfig.lat, mapConfig.lng], mapConfig.zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    clusterGroup.current = L.markerClusterGroup();
    map.addLayer(clusterGroup.current);
    mapInstance.current = map;

    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !clusterGroup.current) return;

    clusterGroup.current.clearLayers();
    if (heatLayer.current) {
      mapInstance.current.removeLayer(heatLayer.current);
      heatLayer.current = null;
    }

    const heatPoints = [];

    detections.forEach((d) => {
      const lat = parseFloat(d.latitude);
      const lng = parseFloat(d.longitude);
      heatPoints.push([lat, lng, 0.5]);

      const color = getCategoryColor(d.waste_category);
      const marker = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: color,
        color: '#fff',
        weight: 2,
        fillOpacity: 0.85,
      });

      const popup = `
        <div style="min-width:200px">
          ${d.waste_image ? `<img src="${resolveImageUrl(d.waste_image)}" style="width:100%;border-radius:8px;margin-bottom:8px"/>` : ''}
          <strong>${formatWasteCategory(d.waste_category)}</strong><br/>
          <small>${lat.toFixed(6)}, ${lng.toFixed(6)}</small><br/>
          <small>${d.detection_date} ${d.detection_time}</small><br/>
          <p style="margin:4px 0 0">${d.description || ''}</p>
        </div>`;
      marker.bindPopup(popup);
      clusterGroup.current.addLayer(marker);
    });

    if (showHeatmap && heatPoints.length) {
      heatLayer.current = L.heatLayer(heatPoints, { radius: 25, blur: 15 });
      mapInstance.current.addLayer(heatLayer.current);
    }
  }, [detections, showHeatmap]);

  useEffect(() => {
    if (mapInstance.current && mapConfig.lat && mapConfig.lng) {
      mapInstance.current.setView([mapConfig.lat, mapConfig.lng], mapConfig.zoom || CAMPUS_MAP.zoom);
    }
  }, [mapConfig]);

  useEffect(() => {
    const t = setTimeout(() => mapInstance.current?.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [fullscreen]);

  useEffect(() => {
    const lat = parseFloat(searchParams.get('lat'));
    const lng = parseFloat(searchParams.get('lng'));
    const zoom = parseInt(searchParams.get('zoom'), 10);
    if (!mapInstance.current || Number.isNaN(lat) || Number.isNaN(lng)) return;
    mapInstance.current.setView([lat, lng], Number.isNaN(zoom) ? 17 : zoom);
    setSearchLat(String(lat));
    setSearchLng(String(lng));
  }, [searchParams, detections]);

  const handleSearch = () => {
    const lat = parseFloat(searchLat);
    const lng = parseFloat(searchLng);
    if (!isNaN(lat) && !isNaN(lng) && mapInstance.current) {
      mapInstance.current.setView([lat, lng], 17);
    }
  };

  return (
    <div className={fullscreen ? 'map-fullscreen' : ''}>
      <div className="card-panel mb-3">
        <div className="row g-2 align-items-end">
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small">Category</label>
            <select className="form-select form-select-sm" value={filters.waste_category}
              onChange={(e) => setFilters({ ...filters, waste_category: e.target.value })}>
              <option value="">All</option>
              {WASTE_CATEGORIES.map((c) => <option key={c} value={c}>{WASTE_CATEGORY_LABELS[c]}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small">From</label>
            <input type="date" className="form-control form-control-sm" value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small">To</label>
            <input type="date" className="form-control form-control-sm" value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small">Lat</label>
            <input className="form-control form-control-sm" placeholder={String(CAMPUS_MAP.lat)} value={searchLat} onChange={(e) => setSearchLat(e.target.value)} />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <label className="form-label small">Lng</label>
            <input className="form-control form-control-sm" placeholder={String(CAMPUS_MAP.lng)} value={searchLng} onChange={(e) => setSearchLng(e.target.value)} />
          </div>
          <div className="col-12 col-md-8 col-lg-2 d-flex gap-1 flex-wrap">
            <button className="btn btn-sm btn-success" onClick={handleSearch}>Go</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowHeatmap(!showHeatmap)}>
              {showHeatmap ? 'Markers' : 'Heatmap'}
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setFullscreen(!fullscreen)}>
              <i className={`bi ${fullscreen ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`} />
            </button>
          </div>
        </div>
      </div>
      <div ref={mapContainer} className="campus-map rounded" />
      <div className="mt-2 d-flex flex-wrap gap-2">
        {WASTE_CATEGORIES.map((c) => (
          <span
            key={c}
            className="badge"
            style={{ background: getCategoryColor(c), color: getCategoryTextColor(c) }}
          >
            {WASTE_CATEGORY_LABELS[c]}
          </span>
        ))}
      </div>
    </div>
  );
}
