import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MiniMap from './MiniMap';
import {
  formatWasteCategory,
  formatRoleLabel,
  getCategoryColor,
  getCategoryColorLight,
  getCategoryTextColor,
  resolveImageUrl,
} from '../utils/constants';

const ZOOM_STEPS = [1, 1.5, 2, 2.5];

export default function DetectionDetailsModal({ detection, onClose, onEdit, showAddedBy = false }) {
  const navigate = useNavigate();
  const [zoomIdx, setZoomIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [copied, setCopied] = useState(false);

  const lat = parseFloat(detection.latitude);
  const lng = parseFloat(detection.longitude);
  const imgUrl = resolveImageUrl(detection.waste_image);
  const conf = Math.min(100, Math.max(0, parseFloat(detection.confidence_score) || 0));
  const zoom = ZOOM_STEPS[zoomIdx];
  const coordsText = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

  const zoomIn = () => setZoomIdx((i) => Math.min(ZOOM_STEPS.length - 1, i + 1));
  const zoomOut = () => setZoomIdx((i) => Math.max(0, i - 1));
  const resetZoom = () => setZoomIdx(0);

  const copyCoords = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(coordsText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }, [coordsText]);

  const openOnMap = () => {
    onClose();
    navigate(`/map?lat=${lat}&lng=${lng}&zoom=17`);
  };

  const statusClass = {
    pending: 'bg-warning text-dark',
    verified: 'bg-success',
    resolved: 'bg-secondary',
  }[detection.status] || 'bg-secondary';

  return (
    <>
      <div className="modal show d-block detection-details-modal" style={{ background: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered detection-details-dialog">
          <div className="modal-content">
            <div className="modal-header py-2 px-3">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <h6 className="modal-title mb-0">Detection Details</h6>
                <span
                  className="badge"
                  style={{
                    background: getCategoryColorLight(detection.waste_category),
                    color: getCategoryTextColor(detection.waste_category),
                    border: `1px solid ${getCategoryColor(detection.waste_category)}`,
                  }}
                >
                  {formatWasteCategory(detection.waste_category)}
                </span>
                {detection.is_hotspot ? (
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                    <i className="bi bi-fire me-1" />Hotspot
                  </span>
                ) : null}
              </div>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>

            <div className="modal-body p-0">
              <div className="detection-details-grid">
                <div className="detection-details-media">
                  {imgUrl ? (
                    <>
                      <div
                        className="detection-details-image-wrap"
                        onClick={() => setLightbox(true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setLightbox(true)}
                        aria-label="Open full image"
                      >
                        <img
                          src={imgUrl}
                          alt="Waste detection"
                          className="detection-details-image"
                          style={{ transform: `scale(${zoom})` }}
                          draggable={false}
                        />
                        <span className="detection-details-expand-hint">
                          <i className="bi bi-arrows-fullscreen" /> Tap to expand
                        </span>
                      </div>
                      <div className="detection-details-zoom-bar">
                        <button type="button" className="btn btn-sm btn-light" onClick={zoomOut} disabled={zoomIdx === 0} aria-label="Zoom out">
                          <i className="bi bi-dash-lg" />
                        </button>
                        <span className="small text-muted">{Math.round(zoom * 100)}%</span>
                        <button type="button" className="btn btn-sm btn-light" onClick={zoomIn} disabled={zoomIdx === ZOOM_STEPS.length - 1} aria-label="Zoom in">
                          <i className="bi bi-plus-lg" />
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={resetZoom} disabled={zoomIdx === 0}>
                          Reset
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="detection-details-no-image">
                      <i className="bi bi-image" />
                      <span>No image</span>
                    </div>
                  )}
                </div>

                <div className="detection-details-info">
                  <div className="detection-detail-card">
                    <span className="detection-detail-label">Confidence</span>
                    <div className="d-flex align-items-center gap-2">
                      <div className="detection-confidence-bar flex-grow-1">
                        <div
                          className="detection-confidence-fill"
                          style={{ width: `${conf}%`, background: getCategoryColor(detection.waste_category) }}
                        />
                      </div>
                      <strong className="small">{conf}%</strong>
                    </div>
                  </div>

                  <div className="detection-detail-card">
                    <span className="detection-detail-label">Location</span>
                    <code className="detection-coords">{coordsText}</code>
                    <div className="detection-detail-actions">
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={copyCoords}>
                        <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`} />
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-success" onClick={openOnMap}>
                        <i className="bi bi-map" /> View on map
                      </button>
                    </div>
                    {!Number.isNaN(lat) && !Number.isNaN(lng) && (
                      <button
                        type="button"
                        className="detection-minimap-btn"
                        onClick={openOnMap}
                        title="Open on campus map"
                      >
                        <MiniMap
                          center={[lat, lng]}
                          zoom={16}
                          points={[{ lat, lng, waste_category: detection.waste_category }]}
                        />
                        <span className="detection-minimap-overlay">
                          <i className="bi bi-geo-alt-fill" /> Open map
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="detection-detail-row">
                    <div className="detection-detail-card flex-fill">
                      <span className="detection-detail-label">Date & time</span>
                      <span className="detection-detail-value">
                        <i className="bi bi-calendar3 me-1 text-muted" />
                        {detection.detection_date}
                        <span className="text-muted mx-1">·</span>
                        {detection.detection_time}
                      </span>
                    </div>
                    <div className="detection-detail-card flex-fill">
                      <span className="detection-detail-label">Status</span>
                      <span className={`badge ${statusClass} text-capitalize`}>{detection.status || 'pending'}</span>
                    </div>
                  </div>

                  {detection.zone_name && (
                    <div className="detection-detail-card">
                      <span className="detection-detail-label">Zone</span>
                      <span className="detection-detail-value">{detection.zone_name}</span>
                    </div>
                  )}

                  {detection.description && (
                    <div className="detection-detail-card">
                      <span className="detection-detail-label">Description</span>
                      <p className="detection-detail-desc mb-0">{detection.description}</p>
                    </div>
                  )}

                  {showAddedBy && (
                    <div className="detection-detail-card">
                      <span className="detection-detail-label">Added by</span>
                      <span className="detection-detail-value fw-semibold">
                        {detection.detected_by_name || 'Unknown user'}
                      </span>
                      {detection.detected_by_email && (
                        <div className="small text-muted">{detection.detected_by_email}</div>
                      )}
                      {detection.detected_by_role && (
                        <span className="badge bg-success-subtle text-success mt-1">
                          {formatRoleLabel({ role: detection.detected_by_role_slug, role_name: detection.detected_by_role })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer py-2 px-3">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>Close</button>
              {onEdit && (
                <button type="button" className="btn btn-sm btn-success" onClick={() => { onClose(); onEdit(detection); }}>
                  <i className="bi bi-pencil me-1" />Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {lightbox && imgUrl && (
        <div
          className="detection-lightbox"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Full size image"
        >
          <button type="button" className="detection-lightbox-close btn btn-light btn-sm" onClick={() => setLightbox(false)}>
            <i className="bi bi-x-lg" />
          </button>
          <img src={imgUrl} alt="Waste detection full size" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}
