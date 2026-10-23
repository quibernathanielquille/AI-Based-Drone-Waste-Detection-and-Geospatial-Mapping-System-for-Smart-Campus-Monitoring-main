import campusBg from '@pictures/BG.png';
import { useLocation } from 'react-router-dom';
import DroneIcon from '../components/DroneIcon';

export default function AuthLayout({ children }) {
  const location = useLocation();
  const isRegister = location.pathname === '/register';

  return (
    <div className="auth-layout min-vh-100 d-flex">
      <div
        className="auth-brand-panel d-none d-lg-flex col-lg-6"
        style={{ backgroundImage: `url(${campusBg})` }}
      >
        <div className="auth-brand-content p-5 text-white">
          <div className="mb-4">
            <DroneIcon size={56} variant="white" />
          </div>
          <h1 className="auth-brand-title mb-3">Campus Eye</h1>
          <p className="auth-brand-subtitle">
            AI-Based Drone Waste Detection and Geospatial Mapping System for environmental sustainability.
          </p>
          <ul className="auth-brand-features list-unstyled mt-4">
            <li className="mb-2"><i className="bi bi-check-circle me-2" /> Real-time waste detection</li>
            <li className="mb-2"><i className="bi bi-check-circle me-2" /> Interactive geospatial maps</li>
            <li className="mb-2"><i className="bi bi-check-circle me-2" /> Analytics & reporting</li>
          </ul>
        </div>
      </div>
      <div className="col-lg-6 d-flex align-items-center justify-content-center p-4">
        <div className="auth-flip-scene">
          <div
            key={location.pathname}
            className={`auth-flip-card ${isRegister ? 'auth-flip-to-register' : 'auth-flip-to-login'}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
