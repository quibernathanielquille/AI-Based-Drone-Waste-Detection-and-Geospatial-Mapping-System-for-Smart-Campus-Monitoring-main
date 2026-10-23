import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasCompletedIntro } from '../utils/intro';

export default function RequireIntro({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;
  if (!hasCompletedIntro()) return <Navigate to="/" replace />;

  return children;
}
