import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const LogsPage = lazy(() => import('./pages/LogsPage.jsx'));
const PassesPage = lazy(() => import('./pages/PassesPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ScannerPage = lazy(() => import('./pages/ScannerPage.jsx'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage.jsx'));
const VisitorPortalPage = lazy(() => import('./pages/VisitorPortalPage.jsx'));
const VisitorsPage = lazy(() => import('./pages/VisitorsPage.jsx'));

const staffRoles = ['admin', 'security', 'employee'];
const operationsRoles = ['admin', 'security'];

function HomeRedirect() {
  const { user } = useAuth();

  if (user?.role === 'visitor') return <Navigate to="/my-visit" replace />;
  if (user?.role === 'employee') return <Navigate to="/visitors" replace />;
  return <Navigate to={user ? '/' : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<div className="page-loading" role="status">Loading page…</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/my-visit" element={<VisitorPortalPage />} />
          <Route element={<AppLayout />}>
            <Route element={<ProtectedRoute roles={operationsRoles} />}>
              <Route index element={<DashboardPage />} />
              <Route path="passes" element={<PassesPage />} />
              <Route path="scan" element={<ScannerPage />} />
              <Route path="logs" element={<LogsPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={staffRoles} />}>
              <Route path="visitors" element={<VisitorsPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
            </Route>
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="users" element={<UserManagementPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<HomeRedirect />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
