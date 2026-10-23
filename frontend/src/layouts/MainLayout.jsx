import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import PageTransitionLoader from '../components/PageTransitionLoader';
import WasteNotificationWatcher from '../components/WasteNotificationWatcher';

const pageTitles = {
  '/dashboard': { brand: 'Campus Eye', title: 'Dashboard' },
  '/waste-detections': { brand: 'Campus Eye', title: 'Waste Detections' },
  '/map': { brand: 'Campus Eye', title: 'Geospatial Map' },
  '/analytics': { brand: 'Campus Eye', title: 'Analytics' },
  '/reports': { brand: 'Campus Eye', title: 'Reports' },
  '/users': { brand: 'Campus Eye', title: 'User Management' },
  '/settings': { brand: 'Campus Eye', title: 'Settings' },
};

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = pageTitles[location.pathname] || { brand: 'Campus Eye', title: 'Overview' };

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-layout">
      <div className={`sidebar-overlay ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`sidebar-wrapper ${mobileOpen ? 'mobile-open' : ''}`}>
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <div className={`main-content ${collapsed ? 'expanded' : ''}`}>
        <Navbar title={title} onMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <main className="page-content page-content-relative">
          <PageTransitionLoader />
          <WasteNotificationWatcher />
          <div className="page-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
