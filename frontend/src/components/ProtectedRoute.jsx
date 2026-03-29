import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { canAccess } from '../utils/roles';

export default function ProtectedRoute({ page, children }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (page && !canAccess(user?.role, page)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
