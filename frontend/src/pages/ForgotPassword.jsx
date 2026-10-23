import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/api';
import AuthLayout from '../layouts/AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.data.message || 'Check your email for reset instructions.');
      if (res.data.data?.reset_token) {
        setToken(res.data.data.reset_token);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-card">
        <h4 className="fw-bold mb-2">Forgot Password</h4>
        <p className="text-muted mb-4">Enter your email to receive reset instructions.</p>

        {message && <div className="alert alert-success">{message}</div>}
        {token && (
          <div className="alert alert-info small">
            Dev token: <Link to={`/reset-password?token=${token}`}>{token.slice(0, 20)}...</Link>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-success w-100" disabled={loading}>Send Reset Link</button>
        </form>
        <p className="text-center mt-3"><Link to="/login" className="text-success">Back to Login</Link></p>
      </div>
    </AuthLayout>
  );
}
