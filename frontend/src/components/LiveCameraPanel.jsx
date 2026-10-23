import { useCallback, useEffect, useRef, useState } from 'react';
import { detectService } from '../services/api';
import { formatWasteCategory, getCategoryColor } from '../utils/constants';

export default function LiveCameraPanel({
  model = 'garbage',
  confidenceThreshold = 50,
  onDetect,
  onSave,
  onError,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectingRef = useRef(false);

  const [active, setActive] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState('Camera off');
  const [preview, setPreview] = useState('');
  const [mlReady, setMlReady] = useState(null);
  const [pending, setPending] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    detectService.health()
      .then((res) => setMlReady(res.data))
      .catch(() => setMlReady({ status: 'offline' }));
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
    setScanning(false);
    setPending(null);
    setPreview('');
    setStatus('Camera off');
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      setPending(null);
      setStatus('Camera ready — tap Detect Now or Start Detection');
    } catch (err) {
      setStatus('Camera access denied or unavailable');
      onError?.(err.message || 'Camera unavailable');
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
    });
  };

  const dismissPending = () => {
    setPending(null);
    setPreview('');
    setStatus('Ready — point camera at waste and detect again');
  };

  const runDetection = useCallback(async () => {
    if (!active || detectingRef.current) return;
    detectingRef.current = true;
    setStatus('Detecting...');

    try {
      const blob = await captureFrame();
      if (!blob) return;

      const res = await detectService.detect(blob, model, confidenceThreshold / 100);
      const data = res.data;
      const best = data.best;

      if (data.annotated_image) setPreview(data.annotated_image);

      if (!best) {
        setStatus('No waste detected — adjust camera or lower threshold');
        setPending(null);
        return;
      }

      setPending({ best, blob, data });
      setScanning(false);
      setStatus(`Found: ${best.label} (${best.confidence}%) — review and save`);
      onDetect?.(best, blob, data);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Detection failed';
      setStatus(msg);
      onError?.(msg);
    } finally {
      detectingRef.current = false;
    }
  }, [active, confidenceThreshold, model, onDetect, onError]);

  const handleSave = async () => {
    if (!pending || saving) return;
    setSaving(true);
    try {
      await onSave?.(pending.best, pending.blob, pending.data);
      setPending(null);
      setPreview('');
      setStatus('Saved! Ready for next detection');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Save failed';
      setStatus(msg);
      onError?.(msg);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!scanning || !active || pending) return undefined;
    const interval = setInterval(runDetection, 3000);
    return () => clearInterval(interval);
  }, [scanning, active, pending, runDetection]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="camera-panel camera-panel-centered">
      <div className="camera-header">
        <span className="camera-title"><i className="bi bi-camera-video" /> Live Camera</span>
        <span className={`badge ${mlReady?.status === 'ok' ? 'bg-success' : 'bg-warning text-dark'}`}>
          {mlReady?.status === 'ok' ? 'ML Online' : 'ML Offline'}
        </span>
      </div>

      <div className="camera-video-wrapper">
        <video ref={videoRef} className="camera-video" playsInline muted />
        {preview && (
          <img src={preview} alt="Detection" className="camera-overlay" />
        )}
        <canvas ref={canvasRef} className="d-none" />
      </div>

      <div className="camera-actions">
        {!active ? (
          <button type="button" className="btn btn-sm btn-success" onClick={startCamera}>
            <i className="bi bi-camera" /> Start Camera
          </button>
        ) : (
          <>
            {!pending && (
              <>
                <button
                  type="button"
                  className={`btn btn-sm ${scanning ? 'btn-warning' : 'btn-primary'}`}
                  onClick={() => setScanning((s) => !s)}
                >
                  <i className={`bi ${scanning ? 'bi-pause-fill' : 'bi-radar'}`} />
                  {scanning ? 'Pause' : 'Scan'}
                </button>
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={runDetection}>
                  Detect Now
                </button>
              </>
            )}
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={stopCamera}>
              Stop
            </button>
          </>
        )}
      </div>

      <div className="camera-status">{status}</div>

      {pending && (
        <div className="camera-pending">
          <div className="camera-pending-info">
            <span
              className="badge camera-pending-badge"
              style={{ background: getCategoryColor(pending.best.category), color: '#fff' }}
            >
              {formatWasteCategory(pending.best.category)}
            </span>
            <span className="camera-pending-conf">{pending.best.confidence}% confidence</span>
          </div>
          <div className="camera-pending-actions">
            <button
              type="button"
              className="btn btn-sm btn-success"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <><span className="spinner-border spinner-border-sm me-1" />Saving...</>
              ) : (
                <><i className="bi bi-database-add me-1" />Save to Database</>
              )}
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={dismissPending} disabled={saving}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
