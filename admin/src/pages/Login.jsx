import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import DroneIcon from '../components/DroneIcon';

const OFFICER_PORTAL_URL = import.meta.env.VITE_OFFICER_PORTAL_URL || 'http://localhost:5173';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password, remember);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-card">
        <div className="text-center mb-4">
          <div className="login-logo mb-3">
            <DroneIcon size={48} />
          </div>
          <h4 className="fw-bold auth-login-title">Campus Eye</h4>
          <p className="text-muted mb-0">Sign in</p>
        </div>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-envelope" /></span>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Admin@admin.com"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <div className="input-group">
              <span className="input-group-text"><i className="bi bi-lock" /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-group-text"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="remember">Remember Me</label>
            </div>
          </div>

          <button type="submit" className="btn btn-success w-100 py-2" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-muted small mt-4 mb-0">
          Environmental officers should use the{' '}
          <a href={OFFICER_PORTAL_URL} className="text-success text-decoration-none fw-semibold">
            Campus Eye portal
          </a>
        </p>
      </div>
    </AuthLayout>
  );
}
