import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, formatRoleLabel } from '../utils/constants';
import { clearIntroComplete } from '../utils/intro';
import DroneIcon from './DroneIcon';

const menuItems = [
  { path: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard', roles: 'all' },
  { path: '/waste-detections', icon: 'bi-trash', label: 'Waste Detections', roles: 'all' },
  { path: '/map', icon: 'bi-geo-alt', label: 'Geospatial Map', roles: 'all' },
  { path: '/analytics', icon: 'bi-bar-chart-line', label: 'Analytics', roles: 'all' },
  { path: '/reports', icon: 'bi-file-earmark-text', label: 'Reports', roles: 'all' },
  { path: '/users', icon: 'bi-people', label: 'User Management', roles: [ROLES.ADMIN] },
  { path: '/settings', icon: 'bi-gear', label: 'Settings', roles: 'all' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    clearIntroComplete();
    navigate('/');
  };

  const filteredMenu = menuItems.filter((item) => {
    if (item.roles === 'all') return true;
    return isAdmin();
  });

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed ? (
          <Link to="/dashboard" className="sidebar-brand-block">
            <DroneIcon size={28} className="sidebar-brand-icon" />
            <div>
              <span className="sidebar-brand">Campus Eye</span>
              <span className="sidebar-tagline">Waste Monitoring</span>
            </div>
          </Link>
        ) : (
          <Link to="/dashboard" className="sidebar-brand-collapsed" title="Campus Eye">
            <DroneIcon size={26} />
          </Link>
        )}
        <button className="sidebar-collapse-btn" onClick={onToggle} type="button" aria-label="Toggle sidebar">
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} />
        </button>
      </div>

      <nav className="sidebar-nav flex-grow-1">
        {filteredMenu.map((item) => (
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
              {(user.first_name?.[0] || 'U')}{(user.last_name?.[0] || '')}
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
