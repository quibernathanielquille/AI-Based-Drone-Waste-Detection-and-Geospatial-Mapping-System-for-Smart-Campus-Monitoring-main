import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatRoleLabel } from '../utils/constants';

function parseTitle(title) {
  if (typeof title === 'object' && title?.title) return title;
  const raw = String(title || 'Campus Eye');
  if (raw.startsWith('Campus Eye ')) {
    return { brand: 'Campus Eye', title: raw.slice('Campus Eye '.length) };
  }
  return { brand: 'Campus Eye', title: raw };
}

export default function Navbar({ title, onMenuToggle }) {
  const { user } = useAuth();
  const { brand, title: pageTitle } = parseTitle(title);

  const initials = `${user?.first_name?.[0] || 'U'}${user?.last_name?.[0] || ''}`.toUpperCase();
  const roleLabel = formatRoleLabel(user);

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button className="navbar-menu-btn d-lg-none" onClick={onMenuToggle} type="button" aria-label="Open menu">
          <i className="bi bi-list" />
        </button>
        <div className="navbar-titles">
          <span className="navbar-eyebrow">{brand}</span>
          <h1 className="navbar-page-title">{pageTitle}</h1>
        </div>
      </div>

      <div className="navbar-right">
        <span className="navbar-status">
          <span className="navbar-status-dot" aria-hidden="true" />
          Online
        </span>

        <Link to="/settings?tab=profile" className="navbar-profile" title="View profile">
          <span className="navbar-avatar" aria-hidden="true">{initials}</span>
          <span className="navbar-profile-text">
            <span className="navbar-profile-name">{user?.first_name} {user?.last_name}</span>
            <span className="navbar-profile-role">{roleLabel}</span>
          </span>
          <i className="bi bi-chevron-right navbar-profile-arrow" aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
