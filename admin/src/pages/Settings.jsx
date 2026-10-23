import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { settingsService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { formatRoleLabel } from '../utils/constants';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [tab, setTab] = useState(tabFromUrl || 'profile');
  const [profile, setProfile] = useState({ first_name: '', last_name: '' });
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm: '' });
  const [system, setSystem] = useState({ campus_name: '', default_map_lat: '', default_map_lng: '', default_map_zoom: '' });
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [saving, setSaving] = useState(false);

  const getApiError = (err, fallback) => {
    const data = err.response?.data;
    if (data?.errors) {
      const flat = Object.values(data.errors).flat();
      if (flat.length) return flat.join(' ');
    }
    return data?.message || err.message || fallback;
  };

  useEffect(() => {
    if (user) setProfile({ first_name: user.first_name, last_name: user.last_name });
    settingsService.get().then((res) => {
      if (res.data.success) {
        const s = res.data.data;
        setSystem({
          campus_name: s.campus_name || '',
          default_map_lat: s.default_map_lat || '',
          default_map_lng: s.default_map_lng || '',
          default_map_zoom: s.default_map_zoom || '',
        });
      }
    });
    settingsService.getActivityLogs({ all: 1 }).then((res) => {
      if (res.data.success) setLogs(res.data.data.items);
    });
  }, [user]);

  const showMsg = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('success');
    }, 4000);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await settingsService.updateProfile(profile);
      await refreshUser();
      showMsg('Profile updated');
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!passwords.current_password.trim()) {
      return showMsg('Enter your current password', 'error');
    }
    if (!passwords.new_password) {
      return showMsg('Enter a new password', 'error');
    }
    if (passwords.new_password.length < 8) {
      return showMsg('New password must be at least 8 characters', 'error');
    }
    if (passwords.new_password !== passwords.confirm) {
      return showMsg('New password and confirmation do not match', 'error');
    }
    if (passwords.current_password === passwords.new_password) {
      return showMsg('New password must be different from your current password', 'error');
    }

    setSaving(true);
    try {
      const res = await settingsService.changePassword({
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPasswords({ current_password: '', new_password: '', confirm: '' });
      showMsg(res.data?.message || 'Password updated successfully');
    } catch (err) {
      showMsg(getApiError(err, 'Could not update password'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'bi-person', desc: 'Your account info' },
    { id: 'password', label: 'Password', icon: 'bi-lock', desc: 'Security' },
    { id: 'system', label: 'System', icon: 'bi-gear', desc: 'Campus config' },
    { id: 'logs', label: 'Activity Logs', icon: 'bi-clock-history', desc: 'All user actions' },
  ];

  useEffect(() => {
    if (tabFromUrl === 'theme') {
      setTab('profile');
      setSearchParams({ tab: 'profile' }, { replace: true });
      return;
    }
    if (tabFromUrl && tabs.some((t) => t.id === tabFromUrl)) {
      setTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const selectTab = (id) => {
    setTab(id);
    setSearchParams({ tab: id }, { replace: true });
  };

  const initials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`.toUpperCase();
  const activeTab = tabs.find((t) => t.id === tab);

  return (
    <div className="settings-page">
      {message && (
        <div className={`settings-toast alert py-2 mb-3 ${messageType === 'error' ? 'alert-danger' : 'alert-success'}`}>
          <i className={`bi me-2 ${messageType === 'error' ? 'bi-exclamation-circle' : 'bi-check-circle'}`} />
          {message}
        </div>
      )}

      <div className="settings-layout">
        <aside className="settings-nav card-panel">
          <div className="settings-nav-profile">
            <span className="settings-nav-avatar">{initials}</span>
            <div>
              <strong>{user?.first_name} {user?.last_name}</strong>
              <span>{formatRoleLabel(user)}</span>
            </div>
          </div>
          <nav className="settings-nav-list">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`settings-nav-item ${tab === t.id ? 'active' : ''}`}
                onClick={() => selectTab(t.id)}
              >
                <i className={`bi ${t.icon}`} />
                <span>
                  <span className="settings-nav-label">{t.label}</span>
                  <span className="settings-nav-desc">{t.desc}</span>
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <section className="settings-content card-panel">
          <header className="settings-content-header">
            <div>
              <h5 className="settings-content-title">{activeTab?.label}</h5>
              <p className="settings-content-subtitle">{activeTab?.desc}</p>
            </div>
            {tab === 'profile' && (
              <span className="settings-email-badge">
                <i className="bi bi-envelope me-1" />{user?.email}
              </span>
            )}
          </header>

          {tab === 'profile' && (
            <div className="settings-section">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label settings-label">First name</label>
                  <input className="form-control settings-input" value={profile.first_name}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label settings-label">Last name</label>
                  <input className="form-control settings-input" value={profile.last_name}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
                </div>
              </div>
              <div className="settings-actions">
                <button type="button" className="btn btn-success btn-sm" onClick={saveProfile} disabled={saving}>
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              </div>
            </div>
          )}

          {tab === 'password' && (
            <div className="settings-section settings-section-narrow">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label settings-label">Current password</label>
                  <input type="password" className="form-control settings-input" value={passwords.current_password}
                    onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                    autoComplete="current-password" />
                </div>
                <div className="col-12">
                  <label className="form-label settings-label">New password</label>
                  <input type="password" className="form-control settings-input" value={passwords.new_password}
                    onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                    minLength={8} autoComplete="new-password" />
                  <div className="form-text">At least 8 characters</div>
                </div>
                <div className="col-12">
                  <label className="form-label settings-label">Confirm new password</label>
                  <input type="password" className="form-control settings-input" value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    autoComplete="new-password" />
                </div>
              </div>
              <div className="settings-actions">
                <button type="button" className="btn btn-success btn-sm" onClick={savePassword} disabled={saving}>
                  {saving ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </div>
          )}

          {tab === 'system' && (
            <div className="settings-section">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label settings-label">Campus name</label>
                  <input className="form-control settings-input" value={system.campus_name}
                    onChange={(e) => setSystem({ ...system, campus_name: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label settings-label">Map latitude</label>
                  <input className="form-control settings-input" value={system.default_map_lat}
                    onChange={(e) => setSystem({ ...system, default_map_lat: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label settings-label">Map longitude</label>
                  <input className="form-control settings-input" value={system.default_map_lng}
                    onChange={(e) => setSystem({ ...system, default_map_lng: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label settings-label">Default zoom</label>
                  <input className="form-control settings-input" value={system.default_map_zoom}
                    onChange={(e) => setSystem({ ...system, default_map_zoom: e.target.value })} />
                </div>
              </div>
              <div className="settings-actions">
                <button type="button" className="btn btn-success btn-sm" onClick={async () => {
                  setSaving(true);
                  try {
                    await settingsService.updateSystem(system);
                    showMsg('System settings saved');
                  } finally {
                    setSaving(false);
                  }
                }} disabled={saving}>
                  Save system settings
                </button>
              </div>
            </div>
          )}

          {tab === 'logs' && (
            <div className="settings-section">
              <div className="table-responsive">
                <table className="table table-sm settings-logs-table">
                  <thead>
                    <tr><th>Action</th><th>Module</th><th>Description</th><th>User</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr><td colSpan={5} className="text-muted text-center py-4">No activity yet</td></tr>
                    ) : logs.map((l) => (
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
          )}
        </section>
      </div>
    </div>
  );
}
