import campusBg from '@pictures/BG.png';
import DroneIcon from '../components/DroneIcon';

export default function AuthLayout({ children }) {
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
          <h1 className="auth-brand-title mb-3">Campus Eye Admin</h1>
          <p className="auth-brand-subtitle">
            Administrator portal for user management, system configuration, and campus-wide oversight.
          </p>
          <ul className="auth-brand-features list-unstyled mt-4">
            <li className="mb-2"><i className="bi bi-check-circle me-2" /> Manage users & roles</li>
            <li className="mb-2"><i className="bi bi-check-circle me-2" /> Configure campus settings</li>
            <li className="mb-2"><i className="bi bi-check-circle me-2" /> View system activity logs</li>
          </ul>
        </div>
      </div>
      <div className="col-lg-6 d-flex align-items-center justify-content-center p-4">
        <div className="auth-flip-scene">
          <div className="auth-flip-card auth-flip-to-login">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
