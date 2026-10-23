import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../layouts/AuthLayout';
import DroneIcon from '../components/DroneIcon';

export default function Register() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors && typeof errors === 'object') {
        setError(Object.values(errors).flat().join(' '));
      } else {
        setError(err.response?.data?.message || err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-card auth-form-compact">
        <div className="text-center mb-3">
          <div className="login-logo mb-2">
            <DroneIcon size={48} />
          </div>
          <h4 className="fw-bold auth-login-title mb-1">Create Account</h4>
          <p className="text-muted small mb-2">Register for Campus Eye</p>
          <span className="auth-personnel-pill">
            <i className="bi bi-person-badge-fill" />
            Personnel · auto-assigned
          </span>
        </div>

        {error && <div className="alert alert-danger py-2 mb-2">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form-compact">
          <div className="row g-2 mb-2">
            <div className="col-6">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="first_name"
                className="form-control form-control-sm"
                value={form.first_name}
                onChange={handleChange}
                required
                minLength={2}
              />
            </div>
            <div className="col-6">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="last_name"
                className="form-control form-control-sm"
                value={form.last_name}
                onChange={handleChange}
                required
                minLength={2}
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="form-label">Email Address</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text"><i className="bi bi-envelope" /></span>
              <input
                type="email"
                name="email"
                className="form-control"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label">Password</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-lock" /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 chars"
                  required
                  minLength={8}
                />
              </div>
            </div>
            <div className="col-6">
              <label className="form-label">Confirm</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-lock-fill" /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password_confirmation"
                  className="form-control"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Repeat"
                  required
                  minLength={8}
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
          </div>

          <button type="submit" className="btn btn-success w-100 py-2" disabled={loading}>
            {loading ? <span className="spinner-border spinner-border-sm" /> : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-muted small mt-3 mb-0">
          Already have an account?{' '}
          <Link to="/login" className="text-success text-decoration-none fw-semibold">Sign In</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
