import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { wasteService, settingsService } from '../services/api';
import {
  isNotifyEnabled,
  setNotifyPrefs,
  fetchLatestDetection,
  checkForNewDetection,
  baselineToLatestDetection,
} from '../utils/wasteNotifications';

const POLL_MS = 12000;

export default function WasteNotificationWatcher() {
  const [toast, setToast] = useState(null);
  const [enabled, setEnabled] = useState(isNotifyEnabled);
  const polling = useRef(false);

  useEffect(() => {
    settingsService.get().then((res) => {
      if (!res.data.success) return;
      const s = res.data.data;
      const on = s.notify_new_waste !== '0';
      setNotifyPrefs({
        notify_new_waste: on,
        push_notifications: s.push_notifications === '1',
      });
      setEnabled(on);
    }).catch(() => {});

    const onPrefs = (e) => {
      if (e.detail?.notify_new_waste !== undefined) {
        setEnabled(!!e.detail.notify_new_waste);
      }
    };

    const onAlert = (e) => {
      if (e.detail) setToast(e.detail);
    };

    window.addEventListener('campus-eye-notify-prefs', onPrefs);
    window.addEventListener('campus-eye-waste-alert', onAlert);
    return () => {
      window.removeEventListener('campus-eye-notify-prefs', onPrefs);
      window.removeEventListener('campus-eye-waste-alert', onAlert);
    };
  }, []);

  const poll = useCallback(async () => {
    if (!isNotifyEnabled() || polling.current) return;
    polling.current = true;
    try {
      const latest = await fetchLatestDetection(wasteService);
      if (latest) checkForNewDetection(latest);
    } catch {
      /* ignore */
    } finally {
      polling.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    (async () => {
      await baselineToLatestDetection(wasteService);
      if (!cancelled) await poll();
    })();

    const interval = setInterval(poll, POLL_MS);
    const onFocus = () => { poll(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') poll();
    });

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, poll]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 10000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="waste-notify-toast" role="status">
      <div className="waste-notify-icon"><i className="bi bi-bell-fill" /></div>
      <div className="waste-notify-body">
        <strong>{toast.title}</strong>
        <span>{toast.body}</span>
        <Link to="/waste-detections" className="waste-notify-link" onClick={() => setToast(null)}>
          View detections
        </Link>
      </div>
      <button type="button" className="waste-notify-close" onClick={() => setToast(null)} aria-label="Dismiss">
        <i className="bi bi-x-lg" />
      </button>
    </div>
  );
}
