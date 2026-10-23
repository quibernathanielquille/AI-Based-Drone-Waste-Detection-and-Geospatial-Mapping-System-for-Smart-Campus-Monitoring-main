import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CAMPUS_MAP, getCategoryColor } from '../utils/constants';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MiniMap({
  points = [],
  center = [CAMPUS_MAP.lat, CAMPUS_MAP.lng],
  zoom = CAMPUS_MAP.zoom,
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: false })
      .setView(center, zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    points.forEach((p) => {
      const fill = getCategoryColor(p.category || p.waste_category);
      L.circleMarker([p.lat, p.lng], {
        radius: 6,
        fillColor: fill,
        color: '#ffffff',
        weight: 2,
        fillOpacity: 0.9,
      }).addTo(map);
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [points, center, zoom]);

  return <div ref={containerRef} className="mini-map rounded" />;
}
