import { formatWasteCategory } from './constants';

export const PREFS_KEY = 'campus_eye_notify_new_waste';
export const PUSH_KEY = 'campus_eye_push_notifications';
export const STORAGE_KEY = 'campus_eye_last_waste_id';
const SKIP_UNTIL_KEY = 'campus_eye_skip_notify_until';

export function isNotifyEnabled() {
  const v = localStorage.getItem(PREFS_KEY);
  if (v === null) return true;
  return v === '1';
}

export function setNotifyPrefs({ notify_new_waste, push_notifications }) {
  if (notify_new_waste !== undefined) {
    localStorage.setItem(PREFS_KEY, notify_new_waste ? '1' : '0');
  }
  if (push_notifications !== undefined) {
    localStorage.setItem(PUSH_KEY, push_notifications ? '1' : '0');
  }
  window.dispatchEvent(new CustomEvent('campus-eye-notify-prefs', {
    detail: { notify_new_waste, push_notifications },
  }));
}

export function getLastSeenId() {
  return Number(localStorage.getItem(STORAGE_KEY) || 0);
}

export function setLastSeenId(id) {
  localStorage.setItem(STORAGE_KEY, String(id));
}

/** Skip alerts briefly after the current user creates a detection (avoid duplicate toast). */
export function skipAlertsBriefly(ms = 4000) {
  sessionStorage.setItem(SKIP_UNTIL_KEY, String(Date.now() + ms));
}

function shouldSkipAlert() {
  return Date.now() < Number(sessionStorage.getItem(SKIP_UNTIL_KEY) || 0);
}

export function buildAlertFromDetection(detection) {
  const label = formatWasteCategory(detection.waste_category);
  return {
    id: detection.id,
    title: 'New waste detected',
    body: `${label} — ${detection.confidence_score}% at ${detection.zone_name || 'campus'}`,
    detection,
  };
}

export function emitWasteAlert(detection) {
  if (!isNotifyEnabled() || !detection?.id) return;
  if (shouldSkipAlert()) {
    setLastSeenId(detection.id);
    return;
  }

  setLastSeenId(detection.id);
  window.dispatchEvent(new CustomEvent('campus-eye-waste-alert', {
    detail: buildAlertFromDetection(detection),
  }));

  if (
    localStorage.getItem(PUSH_KEY) === '1'
    && typeof Notification !== 'undefined'
    && Notification.permission === 'granted'
  ) {
    const label = formatWasteCategory(detection.waste_category);
    new Notification('Campus Eye — New waste detected', {
      body: `${label} (${detection.confidence_score}%)`,
      icon: '/favicon.png',
    });
  }
}

export async function baselineToLatestDetection(wasteService) {
  try {
    const res = await wasteService.getAll({ page: 1, per_page: 1, sort: 'id' });
    const latest = res.data?.data?.items?.[0];
    if (latest?.id) setLastSeenId(latest.id);
    return latest?.id ?? null;
  } catch {
    return null;
  }
}

export async function fetchLatestDetection(wasteService) {
  const res = await wasteService.getAll({ page: 1, per_page: 1, sort: 'id' });
  return res.data?.data?.items?.[0] ?? null;
}

export function checkForNewDetection(latest, { notify = true } = {}) {
  if (!latest?.id || !isNotifyEnabled()) return false;

  const latestId = Number(latest.id);
  const stored = getLastSeenId();

  if (!stored) {
    setLastSeenId(latestId);
    return false;
  }

  if (latestId > stored) {
    if (notify) emitWasteAlert(latest);
    else setLastSeenId(latestId);
    return true;
  }

  return false;
}
