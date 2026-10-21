import { useState } from 'react';
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  ScanLine,
  ShieldCheck,
  Users,
  UserCog,
  X
} from 'lucide-react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const navigation = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'security'] },
  { path: '/visitors', label: 'Visitors', icon: Users, roles: ['admin', 'security', 'employee'] },
  { path: '/appointments', label: 'Appointments', icon: CalendarDays, roles: ['admin', 'security', 'employee'] },
  { path: '/passes', label: 'Issue passes', icon: QrCode, roles: ['admin', 'security'] },
  { path: '/scan', label: 'Scan & verify', icon: ScanLine, roles: ['admin', 'security'] },
  { path: '/logs', label: 'Check logs', icon: ClipboardList, roles: ['admin', 'security'] },
  { path: '/users', label: 'Manage users', icon: UserCog, roles: ['admin'] }
];

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPage = navigation.find(item => item.path === location.pathname);

  function handleSignOut() {
    signOut();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="logo">
          <span className="logo-icon"><ShieldCheck size={22} /></span>
          <span>Gate<span className="logo-light">Pass</span><small>VISITOR MANAGEMENT</small></span>
          <button className="mobile-close" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
            <X />
          </button>
        </div>
        <div className="nav-label">WORKSPACE</div>
        {navigation.filter(item => item.roles.includes(user?.role)).map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setMenuOpen(false)}
            className={`nav-item ${location.pathname === path ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
        <div className="sidebar-bottom">
          <div className="user-avatar">{user?.name?.slice(0, 1).toUpperCase()}</div>
          <div className="user-info">
            <b>{user?.name}</b>
            <small>{user?.role}</small>
          </div>
          <button className="icon-btn" type="button" title="Sign out" onClick={handleSignOut}>
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu" type="button" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
            <Menu />
          </button>
          <div>
            <span className="breadcrumb">Workspace / </span>
            <b>{currentPage?.label || 'My account'}</b>
          </div>
          <div className="top-right">
            <span>{user?.role}</span>
            <div className="top-avatar">{user?.name?.slice(0, 1).toUpperCase()}</div>
          </div>
        </header>
        <div className="page-content"><Outlet /></div>
        <footer>© 2026 GatePass · Visitor access management</footer>
      </main>
    </div>
  );
}
