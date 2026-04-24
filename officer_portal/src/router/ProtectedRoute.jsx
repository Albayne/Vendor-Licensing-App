import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, isCheckingSession } = useAuth();

  if (isCheckingSession) {
    return <div className="auth-wrapper"><div className="card auth-card">Checking session...</div></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
