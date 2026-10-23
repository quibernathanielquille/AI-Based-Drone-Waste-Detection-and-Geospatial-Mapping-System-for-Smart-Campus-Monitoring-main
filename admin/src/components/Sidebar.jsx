import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatRoleLabel } from '../utils/constants';
import DroneIcon from './DroneIcon';

const menuItems = [
  { path: '/dashboard', icon: 'bi-speedometer2', label: 'Admin Dashboard' },
  { path: '/detections', icon: 'bi-trash', label: 'Detection Activity' },
  { path: '/users', icon: 'bi-people', label: 'User Management' },
  { path: '/settings?tab=system', icon: 'bi-sliders', label: 'System Settings' },
  { path: '/settings?tab=logs', icon: 'bi-journal-text', label: 'Activity Logs' },
  { path: '/settings?tab=profile', icon: 'bi-gear', label: 'My Account' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed ? (
          <Link to="/dashboard" className="sidebar-brand-block">
            <DroneIcon size={28} className="sidebar-brand-icon" />
            <div>
              <span className="sidebar-brand">Campus Eye</span>
              <span className="sidebar-tagline">Admin Portal</span>
            </div>
          </Link>
        ) : (
          <Link to="/dashboard" className="sidebar-brand-collapsed" title="Campus Eye Admin">
            <DroneIcon size={26} />
          </Link>
        )}
        <button className="sidebar-collapse-btn" onClick={onToggle} type="button" aria-label="Toggle sidebar">
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} />
        </button>
      </div>

      <nav className="sidebar-nav flex-grow-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={item.label}
          >
            <i className={`bi ${item.icon}`} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && user && (
          <Link to="/settings?tab=profile" className="sidebar-user-link">
            <span className="sidebar-user-avatar">
              {(user.first_name?.[0] || 'A')}{(user.last_name?.[0] || '')}
            </span>
            <span className="sidebar-user-meta">
              <span className="sidebar-user-name">{user.first_name} {user.last_name}</span>
              <span className="sidebar-user-role">{formatRoleLabel(user)}</span>
            </span>
          </Link>
        )}
        <button className="sidebar-link w-100 border-0 bg-transparent" onClick={handleLogout} type="button">
          <i className="bi bi-box-arrow-right" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
