import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Intro from './Intro';

export default function IntroRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-success" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  return <Intro />;
}
