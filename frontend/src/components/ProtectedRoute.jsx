import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  const hasToken = Boolean(localStorage.getItem('vp_token'));

  if (!user || !hasToken) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === 'visitor') return <Navigate to="/my-visit" replace />;
    return <Navigate to="/visitors" replace />;
  }
  return <Outlet />;
}
